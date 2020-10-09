用Puppeteer做一个简单的自动爬虫示例
---


> 本项目仅做参考，提供给新手的一个入门示例。此项目是利用`puppeteer`来爬取本人一个博客系统的数据


- ### 先看演示

![puppeteer-readme_2020-10-09](https://i.loli.net/2020/10/09/hbCUaTPnBAmoSwF.gif#80%)


> 注意：因为是我自己的个人博客，服务器又是在国外，在国内访问较慢。如需运行本demo出现超时，属于正常现象，这种情况下建议开全局代理再试下 

### 目录结构

![20201009155731-readme_2020-10-09](https://i.loli.net/2020/10/09/TjkS7VaDWmfxrFL.png#50%)

- `/data`: 抓取数据存储位置（有条件的可以直接存在数据库中）
- `/utils`: 工具类
- `index.js`: 入口文件（核心代码）
- `config.js`: 配置文件（抓取地址与抓取页面数配置）


### 项目启动

  - 普通启动
    ```shell
    npm start
    ```
  - 调试启动
    ```shell
    npm run dev
    ```

### 核心代码

- 首先引入`puppeteer`与`config.js`配置文件,并用禁用`headless`启动,以便观察
> `puppeteer`依赖`Chromium`，每个页面进程的权限被限制在一个沙盒内，即使某一个页面被恶意软件攻击了，只要将其关掉，就不会对操作系统或者其他的页面产生影响。

```javascript
import puppeteer from "puppeteer";
import config from "./config";

(async () => {
	var browser = await puppeteer.launch({
		headless: false,
		devtools: false,
		defaultViewport: {
			width: 1200,
			height: 1000
		}
	});

	var page = await browser.newPage();
    

    // 这里写爬取数据逻辑代码

	await browser.close();
})();

```
- 在写逻辑代码之前，先看一下咱们今天爬取的[目标网站](http://blog.fe-spark.cn/)进行分析

    > 打开首页就可以看到一个`全部博文`的区域 

    ![20201009162150-readme_2020-10-09](https://i.loli.net/2020/10/09/yljeEmZ3U7VA4oO.png)

    > 分析：
    1. 每页都有6篇文章
    2. 每页下面都有页码，点击下一页之后,地址变成`http://blog.fe-spark.cn/page/页数/`, 而且依然有`全部博文`
    3. 每篇文章信息需要点击进去才能得到完整的博文


- 得到这几条分析结果之后，开始实践
    1. 首先要进行循环操作，那循环谁呢？从目标网站可以看出一共五页，那就循环这五页
    2. 内部还要进行循环，循环的当然就是每页的博文了～因为只有通过循环每个博文之后，才能获取到博文的内容呀～
   
```javascript
for (var i = 0; i <= ALL_PAGES - 1; i++) {
    //先假设有一个loadPage方法，来获取每页的所有博文数据
    var a = await loadPage(i);
    
    // 获取每页的数据进行储存
    writeFileSync(
        resolve(__dirname, "./data/page_" + (i + 1) + ".json"),
        JSON.stringify(a),
        "utf-8"
    );
}
```
- 继续编写`loadPage`方法
  
```javascript
async function loadPage(i) {
    // goto方法是跳转指定页面
    await page.goto(
        // 这里判断一下，因为首页直接就是第一页，从第二页开始后面才要拼接`page/页数/`
        `${origin}/${i == 0 ? "" : "page/" + parseInt(i + 1) + "/"}`,
        {
            waitUntil: "networkidle0",
            timeout: 60000
        }
    );
    // 获取每个博文的跳转链接，用数组存放起来
    var href = await page.$eval(".spark-posts", (dom) => {
        _dom = Array.from(dom.querySelectorAll(".post-card>a"));
        return _dom.map((item) => {
            return item.getAttribute("href");
        });
    });
    // 等待页面加载完毕，获取本页所有博文的标题，简介，及其他需要的数据
    var result = await page.evaluate(() => {
        var links = [];
        var parent = document.querySelector(".spark-posts");
        var list = parent.querySelectorAll(".post-card");
        if (list.length > 0) {
            Array.prototype.forEach.call(list, (item) => {
                var article_title = item.querySelector("a .title")
                    .innerText;
                var description = item.querySelector("a .excerpt")
                    .innerText;
                var mate = item.querySelector(".metadata .date").innerText;
                var tags = Array.prototype.map.call(
                    item.querySelectorAll(".metadata>div a"),
                    (item) => {
                        return item.innerText;
                    }
                );

                links.push({
                    article_title,
                    description,
                    mate,
                    tags
                });
            });
            return links;
        }
    });
    // 以上操作并没有获取博文的内容，下面要进到每篇博文里面，提取博文内容
    for (var i = 0; i < href.length; i++) {
        await page.goto(`${origin}${href[i]}`, {
            waitUntil: "networkidle0",
            timeout: 60000
        });
        
        var content = await page.evaluate(() => {
            return $(".post-wrapper").text();
        });
        result[i].content = content;
    }

    // 最后将组装好的结果返回出去接收
    return result;
}
```

### 最终结果
![20201009175238-readme_2020-10-09](https://i.loli.net/2020/10/09/CusKtMQB4RrPnZi.png)


> 上面代码使用的es2016的api，此项目已配置`babel`,直接运行即可

### 自行下载运行看效果吧
> [点击这里去看项目](https://github.com/sparksworld/crawler-demo)




### 参考
> `Puppeteer`: https://github.com/puppeteer/puppeteer

> `爬虫利器 Puppeteer 实战`： https://www.jianshu.com/p/a9a55c03f768



#### [转载请注明出处，原文地址>>](http://blog.fe-spark.cn/yong-puppeteerzuo-yi-ge-zi-dong-pa-chong-shi-li/)