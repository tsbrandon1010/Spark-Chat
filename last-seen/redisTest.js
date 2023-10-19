const { createClient } = require("redis");

// ydvzSWmuDNPy

const client = createClient({
  url: 'redis://:ydvzSWmuDNPy@localhost:6379'
});

client.on('error', err => console.log('Redis Client Error', err));


async function main() {
  await client.connect();
  const value = await client.get('test');

  console.log(value);
}

main().then(() => process.exit(0), e => { console.error(e); process.exit(1) })
