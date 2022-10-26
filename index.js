import {createRequire} from "module";
import Web3 from "web3";

const require = createRequire(import.meta.url);
const configData = require("./configData.json");

const web3 = new Web3("https://bsc-dataseed.binance.org/");
const smartContract = new web3.eth.Contract(configData["contractAbi"], configData["contractAddress"]);

const baseTransaction = {
    "chainId": 0,
    "from": configData["senderAddress"],
    "to": configData["contractAddress"],
    "value": 0,
    "gas": configData["gasLimit"],
    "gasPrice": configData["gasPrice"]
};
const senderPK = process.env["senderPK"];

const sendTransactionToBlockchain = async (senderPK, functionName, params) => {
    let transactionData = {...baseTransaction};
    let execFunction = smartContract.methods[functionName];
    transactionData["data"] = (typeof params === "object") ? execFunction(...params).encodeABI() : ((params) ? execFunction(params).encodeABI() : execFunction().encodeABI());
    let signedTransaction = await web3.eth.accounts.signTransaction(transactionData, senderPK);
    let transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    return transactionReceipt.status;
};

let currentIteration = 1;
let bnbAmount = "3000000000000000000";
let iterationDuration = parseInt("3600000");
let iterationCounts = parseInt("336");

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const recallingFunction = async () => {
    console.log(await sendTransactionToBlockchain(senderPK, "generateVolume", [bnbAmount]));
    if (currentIteration <= iterationCounts) {
        currentIteration += 1;
        await delay(iterationDuration);
        recallingFunction(bnbAmount).then();
    }
};

const main = async () => {
    baseTransaction["chainId"] = await web3.eth.getChainId();
    Object.freeze(baseTransaction);

    console.log("bnbAmount, iterationDuration, iterationCounts");
    console.log(bnbAmount, iterationDuration, iterationCounts);

    recallingFunction().then();
};

main().then();
