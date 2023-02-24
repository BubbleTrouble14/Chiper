const axios = require("axios"); // Import Axios library
const { RPCAgent, setLogLevel } = require("chia-agent");
const { get_wallet_balance } = require("chia-agent/api/rpc");
const { take_offer, log_in } = require("chia-agent/api/rpc/wallet");

const WebSocket = require("ws");
const sha256 = require("crypto-js/sha256");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const Base64 = require("crypto-js/enc-base64");
const {
  address_to_puzzle_hash,
  puzzle_hash_to_address,
  get_coin_info,
  get_coin_info_mojo,
  bytes_to_hex,
  hex_to_bytes,
} = require("chia-utils");

// const creatorDID = "did:chia:16ahqx9gswvuj4jas839adj553dx4y2ctmjs5rkzy5edz4mysdm9snd2dzu";
// const collectionUUID = "337b4244-437a-43e6-9a17-0cd54560ecdc";
// const creatorDID = "did:chia:16ahqx9gswvuj4jas839adj553dx4y2ctmjs5rkzy5edz4mysdm9snd2dzu";
// const collectionUUID = "337b4244-437a-43e6-9a17-0cd54560ecdc";
// const hashDigest = sha256(creatorDID + collectionUUID);
// const hash = Base64.stringify(hashDigest);
// const encoded = puzzle_hash_to_address(hash, "col");
// console.log(hash, encoded);
// const COLLECTION_ID = "col1d3xv8sehzp9y23lm4w9mgewe55kqk6zhct5l34u0eq8jpllcsw4s9acv87";

const COLLECTION_ID = "6c4cc3c337104a4547fbab8bb465d9a52c0b6857c2e9f8d78fc80f20fff883ab";
const FEE = 0.0005;
const MAX_PRICE = 1;

async function snipeOffer(offer) {
  const agent = new RPCAgent({ service: "wallet" });
  const res = await take_offer(agent, { offer, fee: FEE });
  return res;
}

function main() {
  const socket = new WebSocket("wss://api.dexie.space/v1/stream");

  socket.addEventListener("open", () => {
    console.log("WebSocket connection opened");
  });

  socket.addEventListener("close", () => {
    console.log("WebSocket connection closed");
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      main();
    }, 1000);
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  socket.onmessage = function (event) {
    var response = JSON.parse(event.data);
    if (response.type === "offer") {
      const offerData = response.data;
      if (!offerData.status === 0) {
        return;
      }
      if (!offerData.offered[0].is_nft) {
        return;
      }
      const nft = offerData.offered[0];
      if (!nft.collection) {
        console.log("No collection set");
        return;
      }
      if (!nft.collection.id) {
        console.log("No collection id set");
        return;
      }
      if (nft.collection.id === COLLECTION_ID && offerData.price <= MAX_PRICE) {
        snipeOffer(offerData.offer).then((res) => {
          console.log(res);
        });
      }
      console.log("Not the correct collection: ", nft.collection.id);
    }
  };
}

main();
