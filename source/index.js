import { plugin,clientApi } from "./asyncModule.js";
import {
    addScript,
    processRender,
    highlightRender,
    openByMobile
} from './util/fromSiyuan.js'
import {canvasSaveBlobPromise} from './saveBlob.js'
const 显示导出对话框=(protyle)=> {
    let { Dialog, fetchPost } = clientApi
    let { id } = protyle.block
    const frontEnd = clientApi.getFrontend();
    plugin.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    const exportDialog = new Dialog({
        title: window.siyuan.languages.exportAsImage,
        content: `<div class="b3-dialog__content" style="${plugin.isMobile ? "padding:8px;" : ""};background-color: var(--b3-theme-background)">
        <canvas id="export-bglayer" class="bglayer" style="background-image: url(&quot;/public/siyuan-plugin-background-cover/assets/images/hash-6130f530e783c70.png&quot;); filter: blur(0px); background-position: 50% 50%;overflow:hidden"></canvas>       
        <div 
            style="${plugin.isMobile ? "padding: 16px;margin: 16px 0" : "padding: 48px;margin: 8px 0 8px"};
                    border: 1px solid var(--b3-border-color);
                    border-radius: var(--b3-border-radius-b);
                    max-height:calc(100% - 48px);overflow:auto" 
                    class="export-img export-img-multi protyle-wysiwyg${window.siyuan.config.editor.displayBookmarkIcon ? " protyle-wysiwyg--attr" : ""}" id="preview">
                </div>
        <div class="config-about__logo fn__flex" style="z-index:1">
        <div>
            <img src="/stage/icon.png">
            <span>${plugin.i18n.思源笔记}</span>
            <span class="fn__space"></span>
            <span class="ft__on-surface">${plugin.i18n.重构你的思维}</span>
        </div>
        <div class='fn__space fn__flex-1' style='text-align:center;color:transparent'>
         知行合一&nbsp;经世致用
        </div>
            <div>
                <span class="ft__on-surface">${plugin.i18n.匠造为常}</span>
                <span class="fn__space"></span>
                <span>${plugin.i18n.椽承设计}</span>
                <img src="/plugins/modemkiller/logo.png">
            </div> 
        </div>
    </div>
        <div class="fn__hr--b"></div>
    <div class="fn__hr--b"></div>
</div>
<div class="b3-dialog__action" style='z-index:1'>
    <label class="fn__flex">
        ${window.siyuan.languages.exportPDF5}
        <span class="fn__space"></span>
        <input id="keepFold" class="b3-switch fn__flex-center" type="checkbox" ${window.siyuan.storage['local-exportimg'].keepFold ? "checked" : ""}>
    </label>
    <span class="fn__flex-1"></span>
    <select id="ratio" class="b3-select fn__flex-center fn__size200">
    <option value="4/3">4:3</option>
    <option value="3/4">3:4</option>
    <option value="16/9">16:9</option>
    <option value="9/16">9:16</option>
    <option value="21/9">21:9</option>
    <option value="9/21">9:21</option>
    <option value="9/32">9:32</option>
    <option value="32/9">32/9</option>
    <option value="1/1">1:1</option>
    <option value="按分割线">${plugin.i18n.使用分割线}</option>
    <option value="按大纲最高级">${plugin.i18n.按大纲最高级}</option>

</select>

    <button disabled class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button disabled class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
</div>
 <div class="fn__loading"><img height="128px" width="128px" src="stage/loading-pure.svg"></div>`,
        width: plugin.isMobile ? "92vw" : "990px",
        height: "70vh"
    });
    const ratioSelect = exportDialog.element.querySelector("#ratio");
    const btnsElement = exportDialog.element.querySelectorAll(".b3-button");
    btnsElement[0].addEventListener("click", () => {
        exportDialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
        const selectedRatio = ratioSelect.value;
        //按照分割线导出
        if (selectedRatio == '按分割线') {
            setTimeout(async () => {
                (exportDialog.element.querySelector(".b3-dialog__container")).style.height = "";
                addScript("/stage/protyle/js/html2canvas.min.js?v=1.4.1", "protyleHtml2canvas").then(async () => {
                    //按照分割线导出
                    previewElement.parentElement.style.maxHeight = ""
                    let separatorElements = previewElement.querySelectorAll(':scope > .hr');
                    if (separatorElements[0]) {
                        previewElement.scrollTo({ top: 0 });
                        previewElement.style.maxHeight = separatorElements[0].offsetTop - parseInt(getComputedStyle(previewElement).paddingBottom) + 'px'
                        previewElement.style.height = separatorElements[0].offsetTop + 'px'
                        let canvas = await html2canvas(previewElement.parentElement, {
                            width: previewElement.parentElement.clientWidth,
                            height: previewElement.parentElement.clientHeight,
                            useCORS: true
                        })
                        const blobPromise = () => {
                            return new Promise((resolve, reject) => {
                                canvas.toBlob((blob) => {
                                    try {
                                        const formData = new FormData();
                                        formData.append("file", blob, btnsElement[1].getAttribute("data-title") + 0 + ".png");
                                        formData.append("type", "image/png");
                                        fetchPost("/api/export/exportAsFile", formData, (response) => {
                                            openByMobile(response.data.file);
                                        });
                                        resolve(true)
                                    } catch (e) {
                                        reject(e)
                                    }
                                })

                            })

                        }
                        await blobPromise()
                        for (let i = 0; i < separatorElements.length; i++) {
                            const separator = separatorElements[i];
                            const nextSeparator = separatorElements[i + 1];
                            if (nextSeparator) {
                                let h = nextSeparator.offsetTop - separator.offsetTop - separator.offsetHeight
                                previewElement.style.height = h + 'px'

                                previewElement.style.maxHeight = h + 'px'
                            } else {
                                let h = previewElement.scrollHeight - separator.offsetTop - separator.offsetHeight
                                previewElement.style.height = h + 'px'
                                previewElement.style.maxHeight = h + 'px'
                            }
                            separator.nextElementSibling.scrollIntoView()
                            let canvas = await html2canvas(previewElement.parentElement, {
                                width: previewElement.parentElement.clientWidth,
                                height: previewElement.parentElement.clientHeight,
                                useCORS: true
                            })
                            const blobPromise = () => {
                                return new Promise((resolve, reject) => {
                                    canvas.toBlob((blob) => {
                                        try {
                                            const formData = new FormData();
                                            formData.append("file", blob, btnsElement[1].getAttribute("data-title") + i + 1 + ".png");
                                            formData.append("type", "image/png");
                                            fetchPost("/api/export/exportAsFile", formData, (response) => {
                                                openByMobile(response.data.file);
                                            });
                                            resolve(true)
                                        } catch (e) {
                                            reject(e)
                                        }
                                    })

                                })

                            }
                            await blobPromise()
                        }
                    } else {
                        previewElement.scrollTo({ top: 0 });
                        previewElement.style.maxHeight = previewElement.scrollHeight + 'px'
                        previewElement.style.height = previewElement.scrollHeight + 'px'
                        let canvas = await html2canvas(previewElement.parentElement, {
                            width: previewElement.parentElement.clientWidth,
                            height: previewElement.parentElement.clientHeight,
                            useCORS: true
                        })
                        const blobPromise = () => {
                            return new Promise((resolve, reject) => {
                                canvas.toBlob((blob) => {
                                    try {
                                        const formData = new FormData();
                                        formData.append("file", blob, btnsElement[1].getAttribute("data-title") + 0 + ".png");
                                        formData.append("type", "image/png");
                                        fetchPost("/api/export/exportAsFile", formData, (response) => {
                                            openByMobile(response.data.file);
                                        });
                                        resolve(true)
                                    } catch (e) {
                                        reject(e)
                                    }
                                })

                            })
                        }
                        await blobPromise()

                    }
                });
            }, 500);
        }
        else if (selectedRatio == '按大纲最高级') {
            setTimeout(async () => {
                (exportDialog.element.querySelector(".b3-dialog__container")).style.height = "";
                addScript("/stage/protyle/js/html2canvas.min.js?v=1.4.1", "protyleHtml2canvas").then(async () => {
                    //按照分割线导出
                    previewElement.parentElement.style.maxHeight = ""
                    let selector = 'r'
                    let separatorElements = []
                    for (let i = 1; i < 6; i++) {
                        selector = `:scope > [data-subtype="h${i}"]`
                        if (previewElement.querySelectorAll(selector) && !separatorElements[0]) {
                            separatorElements = previewElement.querySelectorAll(selector);
                        }
                    }
                    if (separatorElements[0]) {
                        previewElement.scrollTo({ top: 0 });
                        previewElement.style.maxHeight = separatorElements[0].offsetTop - parseInt(getComputedStyle(previewElement).paddingBottom) + 'px'
                        previewElement.style.height = separatorElements[0].offsetTop - parseInt(getComputedStyle(previewElement).paddingBottom) + 'px'
                        let canvas = await html2canvas(previewElement.parentElement, {
                            width: previewElement.parentElement.clientWidth,
                            height: previewElement.parentElement.clientHeight,
                            useCORS: true
                        })
                        await canvasSaveBlobPromise(canvas,btnsElement[1].getAttribute("data-title") + 0 + ".png")
                       

                        for (let i = 0; i < separatorElements.length; i++) {
                            const separator = separatorElements[i];
                            const nextSeparator = separatorElements[i + 1];
                            if (nextSeparator) {
                                let h = nextSeparator.offsetTop - separator.offsetTop
                                console.log(h, i)
                                previewElement.style.height = h + 'px'
                                previewElement.style.maxHeight = h + 'px'
                            } else {
                                let h = previewElement.scrollHeight - separator.offsetTop
                                console.log(h, i)
                                previewElement.style.height = h + 'px'
                                previewElement.style.maxHeight = h + 'px'
                            }
                            separator.scrollIntoView()

                            let canvas = await html2canvas(previewElement.parentElement, {
                                width: previewElement.parentElement.clientWidth,
                                height: previewElement.parentElement.clientHeight,
                                useCORS: true
                            })
                            await canvasSaveBlobPromise(canvas,btnsElement[1].getAttribute("data-title") + i + 1 + ".png")
                        }
                    } else {
                        previewElement.scrollTo({ top: 0 });
                        previewElement.style.maxHeight = previewElement.scrollHeight + 'px'
                        previewElement.style.height = previewElement.scrollHeight + 'px'
                        let canvas = await html2canvas(previewElement.parentElement, {
                            width: previewElement.parentElement.clientWidth,
                            height: previewElement.parentElement.clientHeight,
                            useCORS: true
                        })
                        await canvasSaveBlobPromise(canvas,btnsElement[1].getAttribute("data-title") + 0 + ".png")
                    }
                });
            }, 500);
        }
        else if (selectedRatio.indexOf('/') > 0) {
            //按照宽高比导出
            const [widthRatio, heightRatio] = selectedRatio.split("/");
            const RatioValue = parseInt(heightRatio) / parseInt(widthRatio)
            const width = previewElement.parentElement.clientWidth;
            const height = width * RatioValue;
            const innerWidth = previewElement.clientWidth
            const innerHeight = Math.min(innerWidth * RatioValue, height - 60);
            (exportDialog.element.querySelector(".b3-dialog__container")).style.height = "";
            previewElement.parentElement.style.height = height + 'px'
            previewElement.parentElement.style.maxHeight = height + 'px'
            previewElement.style.height = innerHeight + 'px'
            previewElement.style.maxHeight = innerHeight + 'px'
            setTimeout(async () => {
                addScript("/stage/protyle/js/html2canvas.min.js?v=1.4.1", "protyleHtml2canvas").then(async () => {
                    //按照宽高比导出
                    const totalHeight = previewElement.scrollHeight;  // HTML内容的总高度
                    const numImages = Math.ceil(totalHeight / innerHeight);  // 需要的图片数量
                    for (let i = 0; i < numImages; i++) {
                        console.log(i)
                        console.log(innerHeight * i)
                        previewElement.scrollTo({ top: innerHeight * i })
                        let canvas = await html2canvas(previewElement.parentElement, {
                            width: width,
                            height: height,
                            useCORS: true
                        })
                        const blobPromise = () => {
                            return new Promise((resolve, reject) => {
                                canvas.toBlob((blob) => {
                                    try {
                                        const formData = new FormData();
                                        formData.append("file", blob, btnsElement[1].getAttribute("data-title") + i + ".png");
                                        formData.append("type", "image/png");
                                        fetchPost("/api/export/exportAsFile", formData, (response) => {
                                            openByMobile(response.data.file);
                                        });
                                        resolve(true)
                                    } catch (e) {
                                        reject(e)
                                    }
                                })

                            })

                        }
                        await blobPromise()
                    }
                });
            }, 500);
        }

    });
    const previewElement = exportDialog.element.querySelector("#preview");
    const exportBgLayer = exportDialog.element.querySelector("#export-bglayer");

    const foldElement = (exportDialog.element.querySelector("#keepFold"));
    foldElement.addEventListener("change", () => {
        btnsElement[0].setAttribute("disabled", "disabled");
        btnsElement[1].setAttribute("disabled", "disabled");
        btnsElement[1].parentElement.insertAdjacentHTML("afterend", '<div class="fn__loading"><img height="128px" width="128px" src="stage/loading-pure.svg"></div>');
        window.siyuan.storage['local-exportimg'].keepFold = foldElement.checked;
        fetchPost("/api/export/exportPreviewHTML", {
            id,
            keepFold: foldElement.checked,
            image: true,
        }, (response) => {
            refreshPreview(response);
        });
    });
    const refreshPreview = (response) => {
        previewElement.innerHTML = response.data.content;
        processRender(previewElement);
        highlightRender(previewElement);
        previewElement.querySelectorAll("table").forEach((item) => {
            if (item.clientWidth > item.parentElement.clientWidth) {
                item.setAttribute("style", `margin-bottom:${item.parentElement.clientWidth * item.clientHeight / item.clientWidth - item.parentElement.clientHeight + 1}px;transform: scale(${item.parentElement.clientWidth / item.clientWidth});transform-origin: top left;`);
                item.parentElement.style.overflow = "hidden";
            }
        });
        previewElement.querySelectorAll(".li > .protyle-action > svg").forEach(item => {
            const id = item.firstElementChild.getAttribute("xlink:href");
            const symbolElements = document.querySelectorAll(id);
            let viewBox = "0 0 32 32";
            if (id === "#iconDot") {
                viewBox = "0 0 20 20";
            }
            item.setAttribute("viewBox", viewBox);
            item.innerHTML = symbolElements[symbolElements.length - 1].innerHTML;
        });
        btnsElement[0].removeAttribute("disabled");
        btnsElement[1].removeAttribute("disabled");
        let bgLayer = document.getElementById('bglayer');
        if (bgLayer) {
            previewElement.style.backgroundColor = 'transparent'
            exportBgLayer.style.setProperty('background-image', bgLayer.style.backgroundImage)
            exportBgLayer.style.setProperty('background-repeat', 'no-repeat')
            exportBgLayer.style.setProperty('background-attachment', 'fixed')
            exportBgLayer.style.setProperty('background-size', 'cover')
            exportBgLayer.style.setProperty('opacity', '30%')
            exportBgLayer.style.setProperty('top', '0px')
            exportBgLayer.style.setProperty('left', '0px')
            exportBgLayer.style.setProperty('z-index', '0')
        }
        else {
            exportBgLayer.style.display = 'none'
        }
        exportDialog.element.querySelector(".fn__loading").remove();
    };
    fetchPost("/api/export/exportPreviewHTML", {
        id,
        keepFold: foldElement.checked,
        image: true,
    }, (response) => {
        refreshPreview(response);
        btnsElement[1].setAttribute("data-title", response.data.name);
    });
}
plugin.eventBus.on('显示导出对话框',(e)=>{
    显示导出对话框(e.detail.protyle)
})