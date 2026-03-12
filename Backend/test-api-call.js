
import fetch from "node-fetch";

async function testApi() {
    try {
        const res = await fetch("http://localhost:5000/api/products?includeArchived=true");
        if (!res.ok) {
            const err = await res.json();
            console.log("API_ERROR:" + JSON.stringify(err, null, 2));
            return;
        }
        const data = await res.json();
        console.log("API_RESPONSE_COUNT:" + data.length);
        if (data.length > 0) {
            console.log("FIRST_PRODUCT:" + JSON.stringify(data[0], null, 2));
        }
    } catch (err) {
        console.log("NETWORK_ERROR:" + err.message);
    }
}

testApi();
