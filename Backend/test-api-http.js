
import http from "http";

function testApi() {
    http.get("http://localhost:5000/api/products?includeArchived=true", (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
            try {
                const parsed = JSON.parse(data);
                console.log("API_RESPONSE_COUNT:" + (Array.isArray(parsed) ? parsed.length : "NOT_ARRAY"));
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log("FIRST_PRODUCT:" + JSON.stringify(parsed[0], null, 2));
                } else {
                    console.log("FULL_RESPONSE:" + data);
                }
            } catch (e) {
                console.log("PARSE_ERROR:" + e.message + "\nDATA:" + data);
            }
        });
    }).on("error", (err) => {
        console.log("NETWORK_ERROR:" + err.message);
    });
}

testApi();
