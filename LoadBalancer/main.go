package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
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

func getContainers(cli *client.Client) (*[]types.Container, error) {
	containers, err := cli.ContainerList(context.Background(), types.ContainerListOptions{})
	if err != nil {
		return nil, err
	}

	return &containers, nil
}

func runContainer(cli *client.Client, port string) error {

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
		return err
	}

	err = cli.ContainerStart(context.Background(), containerCreateResponse.ID, types.ContainerStartOptions{})
	if err != nil {
		return err
	}

	fmt.Println(opts, containerCreateResponse)

	return nil
}

func main() {

	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		panic(err)
	}

	err = buildImage(cli)
	if err != nil {
		log.Println(err)
	}

	err = runContainer(cli, "port from load balancer")
	if err != nil {
		log.Println(err)
	}

	containers, err := getContainers(cli)
	if err != nil {
		log.Println("Unable to get containers: ", err)
	}

	for _, container := range *containers {
		fmt.Printf("%s %s %s\n", container.ID[:10], container.Image, container.Names[0])
	}
}
