import { plugin, clientApi } from './asyncModule.js';
import { addScript, processRender, highlightRender } from './util/fromSiyuan.js';
import { 兼容移动端打开, 打开临时文件夹 } from './openFile.js';
import {
    checkPermission,
    saveCanvas as 保存画布,
    saveCanvases as 批量保存画布,
} from './saveBlob.js';
let dirHandle;

const 显示导出对话框 = protyle => {
    let { Dialog, fetchPost } = clientApi;
    let { id } = protyle.block;
    const frontEnd = clientApi.getFrontend();
    console.log(frontEnd, clientApi);
    plugin.isMobile = frontEnd === 'mobile' || frontEnd === 'browser-mobile';
    const 导出对话框 = new Dialog({
        title: window.siyuan.languages.exportAsImage,
        content: `<div class="b3-dialog__content" style="${
            plugin.isMobile ? 'padding:8px;' : ''
        };background-color: var(--b3-theme-background)">
        <canvas id="export-bglayer" class="bglayer" style="background-image: url(&quot;/public/siyuan-plugin-background-cover/assets/images/hash-6130f530e783c70.png&quot;); filter: blur(0px); background-position: 50% 50%;overflow:hidden"></canvas>       
        <div 
            style="${
                plugin.isMobile ? 'padding: 16px;margin: 16px 0' : 'padding: 48px;margin: 8px 0 8px'
            };
                    border: 1px solid var(--b3-border-color);
                    border-radius: var(--b3-border-radius-b);
                    max-height:calc(100% - 48px);overflow:auto" 
                    class="export-img export-img-multi protyle-wysiwyg${
                        window.siyuan.config.editor.displayBookmarkIcon
                            ? ' protyle-wysiwyg--attr'
                            : ''
                    }" id="preview">
                </div>
        <div class="config-about__logo fn__flex" style="z-index:1">
        <div>
            <img src="/stage/icon.png">
            <span>${plugin.i18n.思源笔记}</span>
            <span class="fn__space"></span>
        </div>
        <div class='fn__space fn__flex-1' style='text-align:center;color:transparent'>
         知行合一&nbsp;经世致用
        </div>
            <div>
                <span class="ft__on-surface">一条没有故事的巛</span>
                <span class="fn__space"></span>
                <span>Achuan-2</span>
                <img src="/plugins/siyuan-plugin-export/logo.jpg">
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
        <input id="keepFold" class="b3-switch fn__flex-center" type="checkbox" ${
            window.siyuan.storage['local-exportimg'].keepFold ? 'checked' : ''
        }>
    </label>
    <span class="fn__flex-1"></span>
    <select id="ratio" class="b3-select fn__flex-center fn__size200">
    <option value="3/4">3:4</option>
    <option value="4/3">4:3</option>
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

    <button disabled class="b3-button b3-button--cancel">${
        window.siyuan.languages.cancel
    }</button><div class="fn__space"></div>
    <button disabled class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
</div>
 <div class="fn__loading"><img height="128px" width="128px" src="stage/loading-pure.svg"></div>`,
        width: plugin.isMobile ? '92vw' : '990px',
        height: '70vh',
    });
    const 导出比例选择器 = 导出对话框.element.querySelector('#ratio');
    const 按钮元素数组 = 导出对话框.element.querySelectorAll('.b3-button');
    const 取消按钮 = 按钮元素数组[0];
    const 确定按钮 = 按钮元素数组[1];
    const previewElement = 导出对话框.element.querySelector('#preview');
    const exportBgLayer = 导出对话框.element.querySelector('#export-bglayer');
    const foldElement = 导出对话框.element.querySelector('#keepFold');
    foldElement.addEventListener('change', () => {
        按钮元素数组[0].setAttribute('disabled', 'disabled');
        确定按钮.setAttribute('disabled', 'disabled');
        确定按钮.parentElement.insertAdjacentHTML(
            'afterend',
            '<div class="fn__loading"><img height="128px" width="128px" src="stage/loading-pure.svg"></div>'
        );
        window.siyuan.storage['local-exportimg'].keepFold = foldElement.checked;
        fetchPost(
            '/api/export/exportPreviewHTML',
            {
                id,
                keepFold: foldElement.checked,
                image: true,
            },
            response => {
                refreshPreview(response);
            }
        );
    });
    const refreshPreview = response => {
        previewElement.innerHTML = response.data.content;
        processRender(previewElement);
        highlightRender(previewElement);
        //https://github.com/siyuan-note/siyuan/commit/fffc5a56e8ec67a1985ced3bee164cd5cd324670
        previewElement.querySelectorAll('[data-type~="mark"]').forEach(markItem => {
            markItem.childNodes.forEach(item => {
                let spanHTML = '';
                Array.from(item.textContent).forEach(str => {
                    spanHTML += `<span data-type="mark">${str}</span>`;
                });
                const templateElement = document.createElement('template');
                templateElement.innerHTML = spanHTML;
                item.after(templateElement.content);
                item.remove();
            });
            if (markItem.childNodes.length > 0) {
                markItem.setAttribute(
                    'data-type',
                    markItem.getAttribute('data-type').replace('mark', '')
                );
            }
        });

        previewElement.querySelectorAll('table').forEach(item => {
            if (item.clientWidth > item.parentElement.clientWidth) {
                item.setAttribute(
                    'style',
                    `margin-bottom:${
                        (item.parentElement.clientWidth * item.clientHeight) / item.clientWidth -
                        item.parentElement.clientHeight +
                        1
                    }px;transform: scale(${
                        item.parentElement.clientWidth / item.clientWidth
                    });transform-origin: top left;`
                );
                item.parentElement.style.overflow = 'hidden';
            }
        });
        previewElement.querySelectorAll('.li > .protyle-action > svg').forEach(item => {
            const id = item.firstElementChild.getAttribute('xlink:href');
            const symbolElements = document.querySelectorAll(id);
            let viewBox = '0 0 32 32';
            if (id === '#iconDot') {
                viewBox = '0 0 20 20';
            }
            item.setAttribute('viewBox', viewBox);
            item.innerHTML = symbolElements[symbolElements.length - 1].innerHTML;
        });
        按钮元素数组[0].removeAttribute('disabled');
        确定按钮.removeAttribute('disabled');
        /**
         * 这里是为了适配背景图插件
         */
        let bgLayer = document.getElementById('bglayer');
        if (bgLayer) {
            previewElement.style.backgroundColor = 'transparent';
            exportBgLayer.style.setProperty('background-image', bgLayer.style.backgroundImage);
            exportBgLayer.style.setProperty('background-repeat', 'no-repeat');
            exportBgLayer.style.setProperty('background-attachment', 'fixed');
            exportBgLayer.style.setProperty('background-size', 'cover');
            exportBgLayer.style.setProperty('opacity', '30%');
            exportBgLayer.style.setProperty('top', '0px');
            exportBgLayer.style.setProperty('left', '0px');
            exportBgLayer.style.setProperty('z-index', '0');
        } else {
            exportBgLayer.style.display = 'none';
        }
        导出对话框.element.querySelector('.fn__loading').remove();
    };
    fetchPost(
        '/api/export/exportPreviewHTML',
        {
            id,
            keepFold: foldElement.checked,
            image: true,
        },
        response => {
            refreshPreview(response);
            确定按钮.setAttribute('data-title', response.data.name);
        }
    );

    取消按钮.addEventListener('click', () => {
        导出对话框.destroy();
    });
    确定按钮.addEventListener('click', async () => {
        try {
            //桌面平台直接打开导出临时文件夹就可以了
            dirHandle =
                frontEnd !== 'desktop' &&
                window.isSecureContext &&
                (dirHandle || (await window.showDirectoryPicker()));
            await dirHandle.requestPermission({ mode: 'readwrite' });
            let permission = (await dirHandle.queryPermission({ mode: 'readwrite' })) === 'granted';
            dirHandle = permission ? dirHandle : undefined;
        } catch (e) {
            console.warn(e);
        }
        const 当前导出比例模式 = 导出比例选择器.value;
        //按照分割线导出
        if (当前导出比例模式 == '按分割线') {
            导出对话框.element.querySelector('.b3-dialog__container').style.height = '';
            await addScript('/stage/protyle/js/html2canvas.min.js?v=1.4.1', 'protyleHtml2canvas');
            //按照分割线导出
            previewElement.parentElement.style.maxHeight = '';
            let separatorElements = previewElement.querySelectorAll(':scope > .hr');
            let 画布数组 = [];
            if (separatorElements[0]) {
                previewElement.scrollTo({ top: 0 });
                previewElement.style.maxHeight =
                    separatorElements[0].offsetTop -
                    parseInt(getComputedStyle(previewElement).paddingBottom) +
                    'px';
                previewElement.style.height = separatorElements[0].offsetTop + 'px';
                let canvas = await html2canvas(previewElement.parentElement, {
                    width: previewElement.parentElement.clientWidth,
                    height: previewElement.parentElement.clientHeight,
                    useCORS: true,
                });
                画布数组.push({
                    canvas,
                    fileName: 确定按钮.getAttribute('data-title') + 0 + '.png',
                });
                let file = await 保存画布(canvas, 确定按钮.getAttribute('data-title') + 0 + '.png');
                兼容移动端打开(file.url);
                for (let i = 0; i < separatorElements.length; i++) {
                    const separator = separatorElements[i];
                    const nextSeparator = separatorElements[i + 1];
                    if (nextSeparator) {
                        let h =
                            nextSeparator.offsetTop - separator.offsetTop - separator.offsetHeight;
                        previewElement.style.height = h + 'px';

                        previewElement.style.maxHeight = h + 'px';
                    } else {
                        let h =
                            previewElement.scrollHeight -
                            separator.offsetTop -
                            separator.offsetHeight;
                        previewElement.style.height = h + 'px';
                        previewElement.style.maxHeight = h + 'px';
                    }
                    separator.nextElementSibling.scrollIntoView();
                    let canvas = await html2canvas(previewElement.parentElement, {
                        width: previewElement.parentElement.clientWidth,
                        height: previewElement.parentElement.clientHeight,
                        useCORS: true,
                    });
                    画布数组.push({
                        canvas,
                        fileName: 确定按钮.getAttribute('data-title') + i + 1 + '.png',
                    });
                    let file = await 保存画布(
                        canvas,
                        确定按钮.getAttribute('data-title') + i + 1 + '.png'
                    );
                    兼容移动端打开(file.url);
                }
                frontEnd === 'desktop' ? 打开临时文件夹() : await 批量保存画布(画布数组, dirHandle);
            } else {
                previewElement.scrollTo({ top: 0 });
                previewElement.style.maxHeight = previewElement.scrollHeight + 'px';
                previewElement.style.height = previewElement.scrollHeight + 'px';
                let canvas = await html2canvas(previewElement.parentElement, {
                    width: previewElement.parentElement.clientWidth,
                    height: previewElement.parentElement.clientHeight,
                    useCORS: true,
                });
                画布数组.push({
                    canvas,
                    fileName: 确定按钮.getAttribute('data-title') + 0 + '.png',
                });
                let file = await 保存画布(canvas, 确定按钮.getAttribute('data-title') + 0 + '.png');
                兼容移动端打开(file.url);
            }
        } else if (当前导出比例模式 == '按大纲最高级') {
            导出对话框.element.querySelector('.b3-dialog__container').style.height = '';
            await addScript('/stage/protyle/js/html2canvas.min.js?v=1.4.1', 'protyleHtml2canvas');
            //按照分割线导出
            previewElement.parentElement.style.maxHeight = '';
            let selector = 'r';
            let separatorElements = [];
            for (let i = 1; i < 6; i++) {
                selector = `:scope > [data-subtype="h${i}"]`;
                if (previewElement.querySelectorAll(selector) && !separatorElements[0]) {
                    separatorElements = previewElement.querySelectorAll(selector);
                }
            }
            let 画布数组 = [];
            if (separatorElements[0]) {
                previewElement.scrollTo({ top: 0 });
                previewElement.style.maxHeight =
                    separatorElements[0].offsetTop -
                    parseInt(getComputedStyle(previewElement).paddingBottom) +
                    'px';
                previewElement.style.height =
                    separatorElements[0].offsetTop -
                    parseInt(getComputedStyle(previewElement).paddingBottom) +
                    'px';
                let canvas = await html2canvas(previewElement.parentElement, {
                    width: previewElement.parentElement.clientWidth,
                    height: previewElement.parentElement.clientHeight,
                    useCORS: true,
                });
                画布数组.push({
                    canvas,
                    fileName: 确定按钮.getAttribute('data-title') + 0 + '.png',
                });
                let file = await 保存画布(canvas, 确定按钮.getAttribute('data-title') + 0 + '.png');
                兼容移动端打开(file.url);
                for (let i = 0; i < separatorElements.length; i++) {
                    const separator = separatorElements[i];
                    const nextSeparator = separatorElements[i + 1];
                    if (nextSeparator) {
                        let h = nextSeparator.offsetTop - separator.offsetTop;
                        console.log(h, i);
                        previewElement.style.height = h + 'px';
                        previewElement.style.maxHeight = h + 'px';
                    } else {
                        let h = previewElement.scrollHeight - separator.offsetTop;
                        console.log(h, i);
                        previewElement.style.height = h + 'px';
                        previewElement.style.maxHeight = h + 'px';
                    }
                    separator.scrollIntoView();

                    let canvas = await html2canvas(previewElement.parentElement, {
                        width: previewElement.parentElement.clientWidth,
                        height: previewElement.parentElement.clientHeight,
                        useCORS: true,
                    });
                    画布数组.push({
                        canvas,
                        fileName: 确定按钮.getAttribute('data-title') + i + '.png',
                    });
                    let file = await 保存画布(
                        canvas,
                        确定按钮.getAttribute('data-title') + i + '.png'
                    );
                    兼容移动端打开(file.url);
                }
                frontEnd === 'desktop' ? 打开临时文件夹() : await 批量保存画布(画布数组, dirHandle);
            } else {
                previewElement.scrollTo({ top: 0 });
                previewElement.style.maxHeight = previewElement.scrollHeight + 'px';
                previewElement.style.height = previewElement.scrollHeight + 'px';
                let canvas = await html2canvas(previewElement.parentElement, {
                    width: previewElement.parentElement.clientWidth,
                    height: previewElement.parentElement.clientHeight,
                    useCORS: true,
                });
                画布数组.push({
                    canvas,
                    fileName: 确定按钮.getAttribute('data-title') + 0 + '.png',
                });
                let file = await 保存画布(canvas, 确定按钮.getAttribute('data-title') + 0 + '.png');
                兼容移动端打开(file.url);
                frontEnd === 'desktop' ? 打开临时文件夹() : await 批量保存画布(画布数组, dirHandle);
            }
        } else if (当前导出比例模式.indexOf('/') > 0) {
            //按照宽高比导出
            const [widthRatio, heightRatio] = 当前导出比例模式.split('/');
            const RatioValue = parseInt(heightRatio) / parseInt(widthRatio);
            const width = previewElement.parentElement.clientWidth;
            const height = width * RatioValue;
            const innerWidth = previewElement.clientWidth;
            const innerHeight = Math.min(innerWidth * RatioValue, height - 60);
            导出对话框.element.querySelector('.b3-dialog__container').style.height = '';
            previewElement.parentElement.style.height = height + 'px';
            previewElement.parentElement.style.maxHeight = height + 'px';
            previewElement.style.height = innerHeight + 'px';
            previewElement.style.maxHeight = innerHeight + 'px';
            await addScript('/stage/protyle/js/html2canvas.min.js?v=1.4.1', 'protyleHtml2canvas');
            //按照宽高比导出
            const totalHeight = previewElement.scrollHeight; // HTML内容的总高度
            const numImages = Math.ceil(totalHeight / innerHeight); // 需要的图片数量
            let 画布数组 = [];
            for (let i = 0; i < numImages; i++) {
                previewElement.scrollTo({ top: innerHeight * i });
                let canvas = await html2canvas(previewElement.parentElement, {
                    width: width,
                    height: height,
                    useCORS: true,
                });
                画布数组.push({
                    canvas,
                    fileName: 确定按钮.getAttribute('data-title') + i + '.png',
                });
                let file = await 保存画布(canvas, 确定按钮.getAttribute('data-title') + i + '.png');
                兼容移动端打开(file.url);
            }

            frontEnd === 'desktop' ? 打开临时文件夹() : await 批量保存画布(画布数组, dirHandle);
        }
    });
};
plugin.eventBus.on('显示导出对话框', e => {
    显示导出对话框(e.detail.protyle);
});
