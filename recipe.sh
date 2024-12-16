#!/bin/bash

# Check if a name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <name>"
  exit 1
fi

# Get the name from the argument, convert to lowercase, and replace spaces with hyphens
name=$(echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# Create the directory path
directory_path="src/content/recipes/${name}"

# Create the directory
mkdir -p "$directory_path"

# Define the content of the page.mdx file
page_content="---
title: '${1}'
categories:
 - main
hero: img.jpg 
---

## Ingredients
* one
* two

## Method
* one
* two

"

# Write the content to page.mdx inside the created directory
echo "$page_content" > "${directory_path}/index.mdx"

# Output success message
echo "Directory and index.mdx created successfully at ${directory_path}"
