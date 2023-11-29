package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
	"github.com/jhoonb/archivex"
)

func generateBuildContext(dependencies *[]string) (*os.File, error) {
	tar := new(archivex.TarFile)
	tar.Create("dockerfile.tar")
	tar.AddAll(".", true)

	for _, d := range *dependencies {
		file, err := os.OpenFile(d, os.O_RDONLY, os.ModePerm)
		if err != nil {
			return nil, err
		}

		fileInfo, err := os.Stat(d)
		if err != nil {
			return nil, err
		}

		tar.Add(d, file, fileInfo)
	}
	tar.Close()

	dockerBuildContext, err := os.Open("dockerfile.tar")
	if err != nil {
		return nil, err
	}

	return dockerBuildContext, nil
}

func buildImage(cli *client.Client) error {
	dependencies := []string{"../Server/index.js", "../Server/package.json", "../Server/package-lock.json"}
	buildContext, err := generateBuildContext(&dependencies)
	if err != nil {
		return err
	}
	defer buildContext.Close()

	imageName := [1]string{"websocket"}
	opts := types.ImageBuildOptions{
		Tags:        imageName[:],
		Dockerfile:  "Dockerfile",
		Remove:      true,
		NetworkMode: "spark-chat",
	}

	imageBuildResponse, err := cli.ImageBuild(
		context.Background(),
		buildContext,
		opts,
	)
	if err != nil {
		return err
	}

	defer imageBuildResponse.Body.Close()
	_, err = io.Copy(os.Stdout, imageBuildResponse.Body)
	if err != nil {
		return err
	}

	return nil
}

func getContainerIPv4(cli *client.Client, containerId string) (string, error) {

	containerInfo, err := cli.ContainerInspect(context.Background(), containerId)
	if err != nil {
		return "", err
	}

	IPv4 := containerInfo.NetworkSettings.Networks["spark-chat"].IPAddress

	return IPv4, nil
}

func runContainer(cli *client.Client, port string) (string, error) {

	opts := container.Config{
		Image: "websocket",
		Cmd:   []string{"node", "index.js", port},
	}

	containerCreateResponse, err := cli.ContainerCreate(
		context.Background(),
		&opts,
		&container.HostConfig{
			NetworkMode: "spark-chat",
		},
		nil,
		nil,
		"",
	)
	if err != nil {
		return "", err
	}

	err = cli.ContainerStart(context.Background(), containerCreateResponse.ID, types.ContainerStartOptions{})
	if err != nil {
		return "", err
	}

	log.Println("Created Container: ", port)
	return containerCreateResponse.ID, nil
}

type socketData struct {
	Port string `json:"Port"`
	Type string `json:"Type"`
}

func main() {

	log.Println("Started container service")

	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		log.Println("Unable to create Docker SDK client")
		panic(err)
	}

	err = buildImage(cli)
	if err != nil {
		log.Println("Unable to build the Docker image: ", err)
	}

	wsUpgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := wsUpgrader.Upgrade(w, r, nil)
		if err != nil {
			fmt.Println(err)
			return
		}
		log.Println("load balancer connected")
		for {

			data := &socketData{}
			err = conn.ReadJSON(data)
			if err != nil {
				fmt.Println("Unable to read data to JSON", err)
				return
			}

			if data.Type == "create" {
				log.Println("GO - creating new container")
				containerId, err := runContainer(cli, data.Port)
				if err != nil {
					packet := fmt.Sprintf(`{"Type": "create", "Code": "400", "Port": "%s"}`, data.Port)
					conn.WriteMessage(1, []byte(packet))
					log.Println("Unable to create a container: ", err)
				}

				containerIp, err := getContainerIPv4(cli, containerId)
				if err != nil {
					log.Println(err)
				}

				containerURL := fmt.Sprintf(`http://%s:%s`, containerIp, data.Port)
				packet := fmt.Sprintf(`{"Type": "create", "Code": "200", "URL": "%s"}`, containerURL)
				err = conn.WriteMessage(1, []byte(packet))
				if err != nil {
					fmt.Println(err)
					return
				}
			}
		}
	})
	http.ListenAndServe(":3031", nil)
}
