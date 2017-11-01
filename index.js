const path = require('path');
const fs = require('fs');
const glob = require("glob");
const config = require('./config.json');
const qiniu = require('qiniu');
const createClient = require('then-redis').createClient;

//redis配置
const client = createClient();
client.select(3);
client.on("error", function(err) {
    console.log("Error " + err);
});

//上传文件延迟秒数(防封ip)
const delay = 2 * 1000;
/**
 * 延迟函数
 * @param ms 延迟(毫秒)
 * @returns {Promise}
 */
const sleep = (ms = 0) => {
    return new Promise(r => setTimeout(r, ms));
};

//七牛配置
const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);
const options = {
    scope: config.bucket,
    expires: 7200
};
const putPolicy = new qiniu.rs.PutPolicy(options);
const uploadToken = putPolicy.uploadToken(mac);

const zoneConfig = new qiniu.conf.Config();
// 空间对应的机房
zoneConfig.zone = qiniu.zone.Zone_z2;

const formUploader = new qiniu.form_up.FormUploader(config);
const putExtra = new qiniu.form_up.PutExtra();

/**
 * 支持上传验证的七牛云批量上传图片
 * @param  pattern {String} pattern to search for
 * @param options {Object}
 * @param  cb {Function} Called when an error occurs, or matches are found
              err {Error | null}
              matches {Array<String>} filenames found matching the pattern
 */
glob("*.jpg", { "cwd": path.resolve(__dirname, './pics') }, async (err, files) => {
    for (file of files) {
        const readableStream = fs.createReadStream(path.resolve(__dirname, `./pics/${file}`));
        const key = file;
        let sub = file.substring(0,2);
        let uploaded = await client.smembers(`${sub}_uploaded`);
        if (uploaded.indexOf(file) < 0) {
            await sleep(delay);
            await formUploader.putStream(uploadToken, key, readableStream, putExtra, (respErr, respBody, respInfo) => {
                if (respErr) {
                    throw respErr;
                }
                if (respInfo.statusCode == 200) {
                    console.log(respBody);
                } else {
                    console.log(respInfo.statusCode);
                    console.log(respBody);
                    throw `respInfo.statusCode:${respInfo.statusCode},respBody:${respBody}`;
                }
            });
            //成功上传后写入redis作对比用
            client.sadd(`${sub}_uploaded`, file);
        } else {
            console.log(`${file}已上传到七牛云,不再需要上传`);
        }
    }
    console.log(`一共上传了${files.length}张图片,已上传完毕!`)
});