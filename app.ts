import {By, Builder} from "selenium-webdriver";

async function init() {
    let driver = await new Builder().forBrowser('firefox').build();

    await driver.get('https://www.selenium.dev/selenium/web/web-form.html');

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
