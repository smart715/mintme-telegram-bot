import {By, Builder} from "selenium-webdriver";
import {localStorage} from "./config/storage";

async function init() {
    let driver = await new Builder().forBrowser('chrome').build();

    await driver.get('https://web.telegram.org/');
    await driver.sleep(5000)

    for (const item in localStorage) {
        // @ts-ignore
        await driver.executeScript("localStorage.setItem(arguments[0], arguments[1])", item, localStorage[item]);
    }

    await driver.navigate().refresh()

    let title = await driver.getTitle();
    console.log("Web form title: ", title);

    await driver.manage().setTimeouts({implicit: 500})

    let textBox = await driver.findElement(By.name('my-text'))
    let submitButton = await driver.findElement(By.css('button'))

    await textBox.sendKeys('Selenium')
    await submitButton.click()

    let message = await driver.findElement(By.id('message'))
    let value = await message.getText()
    console.log('Received value: ' + value)

    await driver.quit()
}

init().then(() => console.log('finished'))




