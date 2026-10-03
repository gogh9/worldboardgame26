async function checkLive() {
  try {
    const res = await fetch('https://worldboardgame26.web.app/index.html');
    const html = await res.text();
    console.log('Live index.html status:', res.status, 'Length:', html.length);
    const cssMatch = html.match(/style\.css[^\"]*/);
    const jsMatch = html.match(/js\/app\.js[^\"]*/);
    console.log('Live CSS:', cssMatch ? cssMatch[0] : 'none');
    console.log('Live JS:', jsMatch ? jsMatch[0] : 'none');

    // Fetch the live JS
    if (jsMatch) {
      const jsRes = await fetch('https://worldboardgame26.web.app/' + jsMatch[0]);
      const jsText = await jsRes.text();
      console.log('Live JS status:', jsRes.status, 'Length:', jsText.length);
      console.log('Includes openQuizModal:', jsText.includes('openQuizModal'));
      console.log('Includes modalElem.style.display = \'flex\':', jsText.includes("modalElem.style.display = 'flex'"));
    }
  } catch (e) {
    console.error('Error fetching live:', e);
  }
}

checkLive();
