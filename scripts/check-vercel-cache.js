async function check() {
  const urls = [
    'https://www.hvacrevenueboost.com/repair/las-vegas/hvac-unit-short-cycling',
    'https://www.hvacrevenueboost.com/repair/las-vegas/thermostat-display-blank',
    'https://www.hvacrevenueboost.com/repair/las-vegas/ice-on-outdoor-unit'
  ];
  for (const url of urls) {
    const res = await fetch(url);
    console.log(res.status, url);
  }
}
check();
