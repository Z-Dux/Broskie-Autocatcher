const CapSolver = require("capsolver-npm");
const { captchaKey } = require("../config");
const handler = new CapSolver(captchaKey);

/*(async function () {
  await handler
    .hcaptchaenterpriseproxyless(
      "https://discord.com/",
      "key"
    )
    .then((response) => {
      if (response.error === 0) {
      } else {
        console.log("error " + JSON.stringify(response.apiResponse));
      }
    });
});*/

async function genKey() {
  let res = await handler.hcaptchaenterpriseproxyless(
    "https://discord.com/",
    "4c672d35-0701-42b2-88c3-78380b0db560"
  );
  if (res.error == 0) return res.solution;
  else return `error ` + JSON.stringify(res.apiResponse);
}

module.exports = { genKey };