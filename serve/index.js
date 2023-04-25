const express = require('express');
const app = express();
const { OrderReceive, Order, Admin } = require('./db');
const request = require('request');
const multer = require('multer');
const { response } = require('express');

app.use(express.json());
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

app.all('*', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/file/image');
    },
    filename: (req, file, cb) => {
        let type = file.originalname.replace(/.+\./, '.');
        cb(null, Date.now() + type);
    }
})

const upload = multer({ storage: storage })

// 申请接单
app.post('/addNewReceiver', async (req, res) => {
    try {
        await OrderReceive.create(req.body);
        res.send("success")
    } catch (error) {
        res.send("fail")
    }
})

// 登录接口
app.get("/login", async (req, res) => {
    const { code } = req.query;
    request({
        url: `https://api.weixin.qq.com/sns/jscode2session?appid=wx6d5be7f3ab10594c&secret=55ecd4f7adeef442a6dc5e018a8fb077&js_code=${code}&grant_type=authorization_code`
    }, (err, response, data) => {
        res.send(data)
    })
})

// 上传文件
app.post('/uploadImg', upload.array('file', 10), (req, res) => {
    res.send(req.files);
})

// 获取需要审核的接单申请
app.get('/getOrderReceive', async (req, res) => {
    try {
        const result = await OrderReceive.find({
            state: "待审核"
        })
        res.send("result")
    } catch (error) {
        res.status(500).send({
            message: "服务器出错"
        })
    }
})

// 审核用户的接单申请
app.post('/updateOrderReceive', async (req, res) => {
    try {
        const { _id, state, examinePerson } = req.body;
        await OrderReceive.findByIdAndUpdate(_id, {
            state,
            examinePerson
        })
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 获取用户当前所有接单申请
app.get('/findAllReceive', async (req, res) => {
    try {
        const { openid } = req.query;
        const result = await OrderReceive.find({
            openid
        })
        res.send("result")
    } catch (error) {
        res.status(500).send({
            message: "服务器出错"
        })
    }
})

// 提交订单
app.post('/addOrder', async (req, res) => {
    try {
        await Order.create(req.body);
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 获取全部订单接口
app.get('/getAllOrder', async (req, res) => {
    const { page, pageSize } = req.query;
    if (page) {
        const data = await Order.find().skip((page - 1) * pageSize).limit(pageSize);
        const count = await Order.countDocuments();
        res.send({
            data,
            count
        })
    } else {
        const result = await Order.find();
        res.send(result);
    }
});


//获取用户的接单权限
app.get("/getPersonPower", async (req, res) => {
    const { openid } = req.query;
    const result = await OrderReceive.find({
        openid,
        state: "通过"
    })
    res.send(result);
})

//获取我的订单信息
app.get("/getMyOrder", async (req, res) => {
    const { openid } = req.query
    const result = await Order.find({
        openid
    })
    res.send(result);
})

// 获取我帮助的订单信息
app.get("/getMyHelpOrder", async (req, res) => {
    const { receivePerson } = req.query
    const result = await Order.find({
        receivePerson,
        state: "已完成"
    });
    res.send(result);
})

// 获取我帮助的订单数总和
app.get("/getHelpTotalNum", async (req, res) => {
    const { receivePerson } = req.query
    const result = await Order.countDocuments({
        receivePerson,
        state: "已完成"
    });
    res.send({
        count: result
    });
})

// 获取我帮助的订单金额总和
app.get("/getHelpTotalMoney", async (req, res) => {
    const { receivePerson } = req.query
    const result = await Order.aggregate([
        {
            $match: {
                receivePerson,
                state: "已完成"
            }
        },
        {
            $group: {
                _id: "",
                totalNum: {
                    $sum: "$money"
                }
            }
        }
    ])
    res.send(result);
})

// 点击接单
app.get('/toGetOrder', async (req, res) => {
    try {
        const { _id, receivePerson } = req.query;
        await Order.findByIdAndUpdate(_id, {
            receivePerson,
            state: "已帮助"
        });
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 完成订单
app.get('/toFinishOrder', async (req, res) => {
    try {
        const { _id } = req.query;
        const result = await Order.findByIdAndUpdate(_id, {
            state: "已完成"
        });
        const { receivePerson } = result;
        const receiveInfo = await OrderReceive.findOne({
            openid: receivePerson,
            state: "通过"
        })

        let { orderNumber, _id: receiveID } = receiveInfo;
        await OrderReceive.findByIdAndUpdate(receiveID, {
            orderNumber: orderNumber + 1
        });
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 获取正在悬赏接口
app.get("/getRewardOrder", async (req, res) => {
    const result = await Order.find({
        state: "待帮助"
    })
    res.send(result);
})

// 管理员登陆
app.post("/adminLogin", async (req, res) => {
    const { username, password } = req.body;
    const result = await Admin.findOne({
        username,
        password
    });
    res.send(result);
})

// 删除订单
app.get('/deleteOrder', async (req, res) => {
    try {
        const { _id } = req.query;
        await Order.findByIdAndRemove(_id);
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 修改订单
app.post('/updateOrder', async (req, res) => {
    try {
        const { _id } = req.body;
        await Order.findByIdAndUpdate(_id, req.body);
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 查询管理员列表
app.get("/getAdminList", async (req, res) => {
    const result = await Admin.find();
    res.send(result);
})

// 添加管理员
app.post('/addAdmin', async (req, res) => {
    try {
        await Admin.create(req.body);
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 更新管理员信息
app.post('/updateAdmin', async (req, res) => {
    try {
        const { _id } = req.body;
        await Admin.findByIdAndUpdate(_id, req.body);
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 删除管理员
app.get('/deleteAdmin', async (req, res) => {
    try {
        const { _id } = req.query;
        await Admin.findByIdAndRemove(_id);
        res.send("success");
    } catch (error) {
        res.send("fail");
    }
})

// 判断当前用户是否是管理员
app.get('/getAdminPower', async (req, res) => {
    const { openid } = req.query;
    const result = await Admin.findOne({
        openid
    });
    res.send(result);
})

app.listen(3000, () => {
    console.log('server running port 3000!')
})