package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/jhoonb/archivex"
)

func generateTar() *archivex.TarFile {
	tar := new(archivex.TarFile)
	tar.Create("dockerfile.tar")
	tar.AddAll(".", true)

	// loop through the passed array
	// os.openfile
	// os.stat

	// os. add

	return tar
}

func main() {

	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		panic(err)
	}

	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{})
	if err != nil {
		panic(err)
	}

	//fin := nil
	for _, container := range containers {
		fmt.Printf("%s %s %s\n", container.ID[:10], container.Image, container.Names[0])
	}

	dependencies := []string{"index.js", "package.json", "package-lock.json"}

	opts := types.ImageBuildOptions{
		Context:    dockerFileReader,
		Dockerfile: dockerFile,
		Remove:     true,
	}

	imageBuildResponse, err := cli.ImageBuild(
		ctx,
		dockerFileTarReader,
		opts,
	)
	if err != nil {
		log.Println("Unable to build docker image", err)
	}

	defer imageBuildResponse.Body.Close()
	_, err = io.Copy(os.Stdout, imageBuildResponse.Body)
	if err != nil {
		log.Println("Unable to read image build response", err)
	}
}
