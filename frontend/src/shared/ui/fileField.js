import { SVG_clip } from "./svg/clip.js";

export function fileFieldHtml(caption, inputClass, { multiple = false } = {}) {
    return `
        <div class="file-field-group">
            <span class="file-field-caption">${caption}</span>
            <label class="file-field">
                <span class="file-field-clip">${SVG_clip}</span>
                <span class="file-field-text">${multiple ? "Прикрепить фото (можно несколько)" : "Прикрепить фото"}</span>
                <input type="file" class="${inputClass}" ${multiple ? "multiple" : ""} accept="image/*">
            </label>
        </div>`;
}
