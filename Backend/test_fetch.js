async function testFetch() {
    try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        console.log("Fetch success. Length:", data.length);
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}
testFetch();
