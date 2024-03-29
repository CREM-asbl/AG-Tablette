IFS=$'\n'
for file in $(ls "public/images"); do
  if [ -d "public/images/"$file ]; then
    for subfolderfile in $(ls "public/images/"$file); do
      echo "images/"$file"/"$subfolderfile
    done
  else
    echo "images/"$file
  fi
done
