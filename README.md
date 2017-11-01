# 批量上传图片到七牛

## 编写初衷
* 七牛云图形界面不能批量上传
* api方式只接受单个文件
* 编写出可续传批量上传程序

## 使用方法
* 执行```npm i```
* 根据cofig.eg.json新建config.json
* 新建pics文件夹,将要上传到七牛的图片放置其中
* 开启redis
* 执行```npm start```

## 注意
* 该程序仅为测试可用
* 该程序用9千张图片作为测试,运作良好
* 因网络原因可能导致上传respInfo.statusCode 500
* 因设置expires为7200(上传2小时有效),2小时后导致token失效
* 为避免本机ip短时间内多次调用七牛上传api导致封停ip,设置了每次上传间隔时间,可调整delay参数
* 因以上问题导致上传中断可以再次执行```npm start```续传文件
* 当因文件夹内文件过多,出现`Error: ENFILE: file table overflow`,参考[https://github.com/meteor/meteor/issues/8057](https://github.com/meteor/meteor/issues/8057)