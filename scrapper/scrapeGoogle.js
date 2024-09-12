const fs = require('fs');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

(async function scrapeGoogleEmails() {
    let options = new chrome.Options();
    options.addArguments('--headless'); // Set headless mode
    options.addArguments('--disable-gpu'); // Disable GPU for headless mode
    options.addArguments('--no-sandbox'); // Bypass OS security model
    options.addArguments('--disable-dev-shm-usage'); // Overcome limited resource problems

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        let query = 'site:instagram.com, barber dubai, @gmail.com, @yahoo.com, @live.com, @hotmail.com';
        await driver.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

        let allEmails = new Set();

        while (true) {
            // Extract emails from the current page
            let pageText = await driver.findElement(By.tagName('body')).getText();
            let emails = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);

            if (emails) {
                emails.forEach(email => {
                    if (emailRegex.test(email)) {
                        allEmails.add(email);
                    }
                });
            }

            // Attempt to go to the next page
            let nextButton = await driver.findElements(By.id('pnnext'));
            if (nextButton.length > 0) {
                await nextButton[0].click();
                await driver.wait(until.elementLocated(By.tagName('body')), 5000); // Wait for page load
                await driver.sleep(3000); // Give extra time for content to load
            } else {
                break;
            }
        }

        // Write all valid emails to a file
        fs.writeFileSync('emails.txt', Array.from(allEmails).join('\n'));
        console.log('Emails extracted and saved to emails.txt');

    } finally {
        await driver.quit();
    }
})();
