import puppeteer from "puppeteer";

import Spinner from "./utils/spinner";
import { resolve } from "path";
import { writeFileSync, existsSync, mkdirSync } from "fs";

import config from './config'
var tips = new Spinner();
var { exec } = require("child_process");



var ALL_PAGES = config.targetPageSize;
var origin = config.origin;

(async () => {
	tips.start("项目初始化，已设置抓取" + ALL_PAGES + "页数据", "blue");

    // 子进程执行shell命令rm，慎重修改
	exec("rm -rf ./data", (err, stdout, stderr) => {
		if (err) {
			console.log(err);
			return;
		}
	});

	var browser = await puppeteer.launch({
		headless: false,
		devtools: false,
		defaultViewport: {
			width: 1200,
			height: 1000
		}
	});

	// var target = browser.target()
	var page = await browser.newPage();
	tips.succeed("项目初始化完成", "green");
	for (var i = 0; i <= ALL_PAGES - 1; i++) {
		var _savePath = resolve(__dirname, "./data");
		tips.start("开始抓取第" + (i + 1) + "页", "blue");
		var a = await loadPage(i);
		tips.setText("抓取完毕， 正在存入");

		if (existsSync(_savePath)) {
			tips.setText("发现存在文件夹", "yellow");
		} else {
			tips.warn("发现不存在文件夹，已进行创建", "yellow");
			mkdirSync(_savePath);
			tips.start("创建完毕");
		}
		writeFileSync(
			resolve(__dirname, "./data/page_" + (i + 1) + ".json"),
			JSON.stringify(a),
			"utf-8"
		);
		tips.succeed("第" + (i + 1) + "页存入成功！");
		if (i + 1 == ALL_PAGES) tips.succeed("抓取完毕，停止操作");
	}
	async function loadPage(i) {
		var index = i;
		try {
			await page.goto(
				`${origin}/${i == 0 ? "" : "page/" + parseInt(i + 1) + "/"}`,
				{
					waitUntil: "networkidle0",
					timeout: 60000
				}
			);
		} catch (err) {
			console.log(err);
			tips.fail("网络出错，请检查～", "red");
		}

		var href = await page.$eval(".spark-posts", (dom) => {
			_dom = Array.from(dom.querySelectorAll(".post-card>a"));
			return _dom.map((item) => {
				return item.getAttribute("href");
			});
		});

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
		// return result
		for (var i = 0; i < href.length; i++) {
			tips.setText(
				"第" + (index + 1) + "页的第" + (i + 1) + "篇开始抓取",
				"blue"
			);
			try {
				await page.goto(`${origin}${href[i]}`, {
					waitUntil: "networkidle0",
					timeout: 60000
				});
			} catch (error) {
				tips.fail("网络出错，请检查～", "red");
			}

			var content = await page.evaluate(() => {
				return $(".post-wrapper").text();
			});
			result[i].content = content;
			tips.setText(
				"第" + (index + 1) + "页的第" + (i + 1) + "篇抓取完毕",
				"blue"
			);
		}
		return result;
	}

	await browser.close();
})();
