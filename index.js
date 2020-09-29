import puppeteer from 'puppeteer'
import chalk from 'chalk'
import {
    resolve
} from 'path'
import {
    writeFileSync
} from 'fs'
const log = console.log

const sleep = t => new Promise((resolve) => setTimeout(resolve, t));
const origin = "http://blog.fe-spark.cn";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: false,
        defaultViewport: {
            width: 1200,
            height: 1000
        }
    })
    const ALL_PAGES = 1
    // const target = browser.target()
    const page = await browser.newPage()
    // page.on('console', msg => {
    //     if (typeof msg === 'object') {
    //         console.dir(msg)
    //     } else {
    //         log(chalk.blue(msg))
    //     }
    // })
    log(chalk.green('页面初始化完成'))
    for (var i = 0; i <= ALL_PAGES; i++) {
        const a = await loadPage(i)

        log(chalk.yellow(`抓取完毕， 正在存入`))
        writeFileSync(resolve(__dirname, './data/page_' + (i + 1) + '.json'), JSON.stringify(a), 'utf-8')
        log(chalk.green('存入成功！请等待...'))
    }
    async function loadPage(i) {
        log(chalk.yellow(`正在抓取第${i + 1}页的数据`))
        await page.goto(`${origin}/${i == 0? '' : 'page/'+parseInt(i + 1)+'/'}`, {
           waitUntil: 'networkidle0'
        });
        const href = await page.$eval('.spark-posts', (dom) => {
            _dom = Array.from(dom.querySelectorAll('.post-card>a'))
            return _dom.map(item => {
                return item.getAttribute('href')
            })
        })
        
        const result = await page.evaluate(() => {
            var links = []
            var parent = document.querySelector('.spark-posts')
            var list = parent.querySelectorAll('.post-card')
            if (list.length > 0) {
                Array.prototype.forEach.call(list, (item) => {
                    var article_title = item.querySelector('a .title').innerText;
                    var description = item.querySelector('a .excerpt').innerText;
                    var mate = item.querySelector('.metadata .date').innerText;
                    var tags = item.querySelectorAll('.metadata>div a')

                    links.push({
                        article_title,
                        description,
                        mate,
                        tags
                    })
                })
                return links
            }
        })
        // return result
        for (var i = 0; i < href.length; i++) {
            await page.goto(`${origin}${href[i]}`, {
               waitUntil: 'networkidle0'
            });
            const content = await page.evaluate(() => {
                return $('.post-wrapper').text()
            })
            result[i].content = content
            // log(chalk.blue(content))
        }
        return result
    }

    await browser.close();
})()