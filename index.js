#!/usr/bin/env node

const sharp = require('sharp');

const program = require('commander');
program
    .version('0.0.1', '-v, --version')
    .option('-p, --profile [value]', 'Profile name in .aws/credentials')
    .option('-i, --input-bucket [value]', 'Input bucket name')
    .option('-o, --output-bucket [value]', 'Output bucket name', null)
    .option('-n, --num [value]', 'Max number of creating thumbnail (for test)', Number.MAX_SAFE_INTEGER)
    .option('-w, --width [value]', 'Width of thumbnail (default: 200)', 200)
    .option('-h, --height [value]', 'Height of thumbnail (default: 200)', 200)
    .parse(process.argv);

const PROFILE = program.profile;
const INPUT_BUCKET = program.inputBucket;
const OUTPUT_BUCKET = (program.outputBucket) ? program.outputBucket : (INPUT_BUCKET + '-thumbnail');
const TEST_NUM = parseInt(program.num);
const WIDTH = parseInt(program.width);
const HEIGHT = parseInt(program.height);

const AWS = require('aws-sdk');
const credentials = new AWS.SharedIniFileCredentials({ profile: PROFILE });
AWS.config.credentials = credentials;
const s3 = new AWS.S3();

let testNum = 0;

function main() {
    checkInputBucketExist()
        .then(checkOutputBucketExist)
        .then(function () {
            iterateObjects();
        })
        .catch(function (err) {
            console.log(err);
        });
}

const checkInputBucketExist = function () {
    return new Promise(function (resolve, reject) {
        getBucketLocation(INPUT_BUCKET, function (err, location) {
            if (err) {
                reject('[ERROR] input bucket is not exist');
            } else {
                resolve(location);
            }
        });
    });
};

const checkOutputBucketExist = function () {
    return new Promise(function (resolve, reject) {
        getBucketLocation(OUTPUT_BUCKET, function (err, location) {
            if (err) {
                reject('[ERROR] output bucket is not exist');
            } else {
                resolve(location);
            }
        });
    });
};

function getBucketLocation(bucketName, callback) {
    const params = {
        Bucket: bucketName
    };

    s3.getBucketLocation(params, function (err, data) {
        if (err) {
            callback(err, null);
        } else {
            const location = data.LocationConstraint;
            callback(null, location);
        }
    });
}

function iterateObjects(nextContinuationToken) {
    if (testNum >= TEST_NUM)
        return;

    let params = {
        Bucket: INPUT_BUCKET,
        MaxKeys: 10
    };

    if (nextContinuationToken !== null) {
        params.ContinuationToken = nextContinuationToken;
    }

    s3.listObjectsV2(params, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        processList(data.Contents);

        if (data.IsTruncated) {
            iterateObjects(data.NextContinuationToken);
        }
    });
}

function processList(list) {
    if (testNum >= TEST_NUM)
        return;

    for (const i in list) {
        if (!list.hasOwnProperty(i)) {
            continue;
        }

        processItem(list[i]);
    }
}

function processItem(item) {
    if (testNum++ >= TEST_NUM)
        return;

    const key = item.Key;
    const ext = key.substr(key.lastIndexOf('.') + 1).toLowerCase();

    if (!['jpg', 'jpeg', 'png'].includes(ext))
        return;

    const params = {
        Bucket: INPUT_BUCKET,
        Key: key
    };

    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        const buffer = data.Body;
        processBuffer(key, buffer);
    });
}

function processBuffer(key, buffer) {
    sharp(buffer)
        .resize(WIDTH, HEIGHT)
        .withoutEnlargement(true)
        .toBuffer(function (err, data, info) {
            if (err) {
                console.log(err);
                return;
            }

            putObject(key, data);
        });
}

function putObject(key, buffer) {
    const params = {
        Body: buffer,
        Bucket: OUTPUT_BUCKET,
        Key: key
    };

    s3.putObject(params, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        console.log("[Done] " + key)
    });
}

main();