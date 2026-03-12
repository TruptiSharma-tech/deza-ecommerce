
async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/admin/hero-settings');
        const data = await res.json();
        console.log('Hero Settings:', data);
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

test();
