const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path')

// Function to find email on the current page
async function findEmailOnPage(driver, defaultEmail) {
    try {
        const bodyText = await driver.findElement(By.tagName('body')).getText();
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
        const emails = bodyText.match(emailRegex);

        // Return the first found email or the default provided email
        return emails ? emails[0] : defaultEmail;
    } catch (error) {
        console.error(`Error finding email: ${error.message}`);
        return null;
    }
}

// Function to get social media links from the current page
async function getSocialMediaLinks(driver) {
    const socialMediaPlatforms = ['facebook', 'instagram', 'linkedin', 'tiktok', 'twitter', 'youtube'];
    let links = [];

    try {
        const elements = await driver.findElements(By.tagName('a'));
        for (let element of elements) {
            const href = await element.getAttribute('href');
            if (href && socialMediaPlatforms.some(platform => href.includes(platform))) {
                links.push(href);
            }
        }
    } catch (error) {
        console.error(`Error extracting social media links: ${error.message}`);
    }

    return links;
}

// Function to process each business
async function processBusiness(driver, business) {
    let resultData = { businessName: business.name, phoneNumber: business.phone, email: business.email, website: '', socialMedia: [] };

    try {
        if (business.website) {
            // Visit the provided website
            await driver.get(business.website);
        } else {
            // Search for the website using business name and phone number on Google if not provided
            let searchQuery = `${business.name} ${business.phone}`;
            let url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            await driver.get(url);

            // Click the first result to go to the website
            let firstResult = await driver.findElement(By.css('h3')).click();
            await driver.wait(until.titleContains(business.name), 10000);
        }

        // Get the current URL (website)
        resultData.website = await driver.getCurrentUrl();

        // Search for email on the website
        let emailFound = await findEmailOnPage(driver, business.email);
        if (emailFound) {
            resultData.emailFoundOn = 'Website';
            resultData.email = emailFound;
            return resultData;
        }

        // Extract social media links from the website
        let socialMediaLinks = await getSocialMediaLinks(driver);

        if (socialMediaLinks.length > 0) {
            for (let link of socialMediaLinks) {
                await driver.get(link);
                emailFound = await findEmailOnPage(driver, business.email);

                if (emailFound) {
                    resultData.socialMedia.push({ platform: getPlatformName(link), link });
                    resultData.emailFoundOn = getPlatformName(link);
                    resultData.email = emailFound;
                    return resultData;
                }
            }
        }

        resultData.emailFoundOn = 'Not Found';
        return resultData;

    } catch (error) {
        console.error(`Error processing ${business.name}: ${error.message}`);
        resultData.error = error.message;
        return resultData;
    }
}

// Function to determine the social media platform from a URL
function getPlatformName(link) {
    if (link.includes('facebook')) return 'Facebook';
    if (link.includes('instagram')) return 'Instagram';
    if (link.includes('linkedin')) return 'LinkedIn';
    if (link.includes('tiktok')) return 'TikTok';
    if (link.includes('twitter')) return 'Twitter';
    if (link.includes('youtube')) return 'YouTube';
    return 'Unknown';
}

// Main function to process all businesses
async function processAllBusinesses() {
    let options = new chrome.Options();
    options.addArguments("--headless");
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--disable-gpu");

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    let businesses = JSON.parse(fs.readFileSync(path.join('../data/input_data.json'), 'utf8'));
    let results = [];

    for (let business of businesses) {
        console.log(`Processing ${business.name}...`);
        let result = await processBusiness(driver, business);
        results.push(result);
    }

    await driver.quit();

    // Save all results to a single JSON file
    saveData(results);
}

function saveData(data) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync('extracted_data.json', jsonData, 'utf8');
    console.log('All data saved to extracted_data.json');
}

// Run the main process
processAllBusinesses();
