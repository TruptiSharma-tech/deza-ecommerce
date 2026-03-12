
import http from "http";

function testApi() {
    http.get("http://localhost:5000/api/products?includeArchived=true", (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
            try {
                const parsed = JSON.parse(data);
                console.log("COUNT:" + parsed.length);
                parsed.forEach((p, i) => {
                    console.log(`Product ${i}: ${p.title} | image: ${p.image ? 'YES' : 'NO'} | mainImage: ${p.mainImage ? 'YES' : 'NO'}`);
                });
            } catch (e) {
                console.log("ERROR:" + e.message);
            }
        });
    });
}

testApi();
