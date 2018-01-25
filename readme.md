# S3-thumbnail-generator

generate thumbnail bucket

only support jpg, png


Usage: s3thumb [options]

  Options:

    -v, --version                output the version number
    -p, --profile [value]        Profile name in .aws/credentials
    -i, --input-bucket [value]   Input bucket name
    -o, --output-bucket [value]  Output bucket name (default: null)
    -n, --num [value]            Max number of creating thumbnail (for test) (default: 9007199254740991)
    -w, --width [value]          Width of thumbnail (default: 200) (default: 200)
    -h, --height [value]         Height of thumbnail (default: 200) (default: 200)
    -h, --help                   output usage information
