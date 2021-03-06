var express = require('express');
var config = require('./config');
var watermark = require('./watermark');
var qiniu = require('qiniu');
var http = require('http');


var router = express.Router();

var AK = process.env.ACCESS_KEY || config.ACCESS_KEY;
var SK = process.env.SECRET_KEY || config.SECRET_KEY;
var Domain = process.env.Domain || config.Domain;
var Bucket_Name = process.env.Bucket_Name || config.Bucket_Name;


qiniu.conf.ACCESS_KEY = AK;
qiniu.conf.SECRET_KEY = SK;



/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', {
        title: '双十一搞基不寂寞'
    });
});

router.post('/gaoji', function(req, res, next) {

    var jiyouA = req.param('jiyou-a');
    var jiyouB = req.param('jiyou-b');
    if (jiyouB.length < 2 || jiyouA.length < 2) {
        res.json({
            error: 'invailed args'
        });
        return false;
    }

    var originInfo = getRandomImage();
    var order = originInfo.order;
    var link = originInfo.link;

    var fullLink = getFullLink(link, order, jiyouA, jiyouB);

    var key = generateKey(link, order);
    var newEntryURI = Bucket_Name + ':' + key;
    // console.log(newEntryURI)
    fullLink = fullLink + '|saveas/' + qiniu.util.urlsafeBase64Encode(newEntryURI);
    // console.log(fullLink);

    // 在图片中随机选择一张图
    // 种下cookie，下一次根据cookie排除这张已经生成的图
    // 若cookie 已满，再随机生成图片
    // 根据图片需要控制文字对应的位置、文字数量
    // 生成唯一的文件名

    var sign = qiniu.util.hmacSha1(fullLink, SK)
    var signUrl = 'http://' + fullLink + '/sign/' + AK + ':' + qiniu.util.base64ToUrlSafe(sign);

    var outer_res = res;
    console.log(signUrl);
    http.get(signUrl, function(res) {
        if (res.statusCode == 200) {
            // console.log(Domain + '/' + key)
            outer_res.json({
                status: 'ok',
                imageLink: Domain + '/' + key
            });
        } else {
            outer_res.json({
                ok: 'not ok'
            });
        }
    }).on('error', function(e) {
        outer_res.json({
            ok: e.message
        });
    });

});

function generateKey(link, order) {
    var result = '',
        length = '15',
        chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var fileType = link.split('.').pop() || 'jpg';
    for (var i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    result = order + '/' + result + new Date().getTime() + '.' + fileType;
    return result;
}

function getRandomImage() {
    // return {
    //     // link: 'gaoji1111.qiniudn.com/origin/runtu.jpg',
    //     // order: 1
    // }
    // return {
    //     link: 'gaoji1111.qiniudn.com/origin/yamaidie.jpg',
    //     order: 2
    // }
    return {
        link: 'gaoji1111.qiniudn.com/origin/jj.jpg',
        order: 3
    }
}

function getFullLink(link, order, jiyouA, jiyouB) {
    var fullLink = '';

    switch (order) {
        case 1:
            fullLink = watermark.getLink1(link, jiyouA, jiyouB);
            break;
        case 2:
            fullLink = watermark.getLink2(link, jiyouA, jiyouB);
            break;
        case 3:
            fullLink = watermark.getLink3(link, jiyouA, jiyouB);
            break;
        default:
            break;
    }
    return fullLink;
}

module.exports = router;
