const sha256 = require("sha256")
const Secp256k1 = require('@lionello/secp256k1-js')
const axios = require('axios');

const userData = {
    appId: "25dzX3vbYqktVxyX",
	deviceId: "axxx43388afe417xxx616b35e5c4738a", // DevTools -> Application -> Local Storage -> token -> device_id
	userId: "81xxxexxxefd4bb28b9d6d2b1f68b51c", // DevTools -> Application -> Local Storage -> token -> user_id
	nonce: 0,
	publicKey: "",
	signatureData: "",
    drive_id:"6xxxx93", // DevTools -> Application -> Local Storage -> cna
    authorization: ""  // Request Headers -> authorization   Bearer xxxxxxxxxx
}

const headers = { 
    'content-type': 'application/json',
    "authorization": "",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    "origin": "https://aliyundrive.com",
    "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
    "x-canary": "client=web,app=adrive,version=v3.17.0",
    "x-device-id": '',
    "x-signature": '',
 }

const randomString =(l) => {
	let bytes = new Uint8Array(l).fill(0);
	for( let i = 0; i < l; i++) {
		bytes[i] = (randInt(1, 2^256-1)).toString(2);
	}
	return bytes;
}

const randInt =(min, max) => {
	return min + Math.floor(Math.random() * (max - min + 1)) + min
}

const CreateSession = () => {
	const api = `https://api.aliyundrive.com/users/v1/users/device/${userData.nonce ? 'renew_session' : 'create_session'}`;
	const  data = {
        "deviceName": "Edge浏览器",
        "modelName": "Windows网页版",
        "pubKey": userData.publicKey
    }
    return axios({
        method: 'post',
        url: api,
        data: userData.nonce ? {} : data,
        headers: headers,
      });
      
}
const DownloadFile = (file_id) => {
    return axios({
        method: 'post',
        url: 'https://api.aliyundrive.com/v2/file/get_download_url',
        data: {"drive_id": userData.drive_id,"file_id": file_id,"expire_sec": 14400},
        headers: {...headers},
    });
}
const  InitAliKey = () => {
    const {appId, deviceId, userId, nonce} = userData;
	const max = 32;
	const privKey = randomString(max);
	const data = new Uint8Array(sha256(`${appId}:${deviceId}:${userId}:${nonce}`, { asBytes: true }));

    const privateKey = Secp256k1.uint256(privKey, 16);
    const publicKey = Secp256k1.generatePublicKeyFromPrivateKeyData(privateKey);
    userData.publicKey = "04" + publicKey.x + publicKey.y;
    // Signing a digest
    const digest = Secp256k1.uint256(data, 16);
    const sig = Secp256k1.ecsign(privateKey, digest);
    userData.signatureData = ''+sig.r + sig.s + '01';

    // set headers
    headers['x-device-id'] = userData.deviceId;
    headers['x-signature'] = userData.signatureData;
    headers['authorization'] = userData.authorization;
  
}

const main = async () => {
    InitAliKey();
    if(!userData.publicKey || !headers['x-signature'] || !userData.authorization) {
        console.log('need set the userdata');
        return
    }
    const session = await CreateSession();
    console.log(session.data) // { result: true, success: true, code: null, message: null }
    // file_id
    const res = await DownloadFile("63593fa174c6c1548c284a039377b1bb47a8a01d");
    console.log(res.data) // {domain_id: '', drive_id: '', file_id:'', revision_id:'', url: '', internal_url: ''}

}
main();
