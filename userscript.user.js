// ==UserScript==
// @name         Steam Trade History Light Mode
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Combines equal items in Steam trade history while preserving item details with wrapping, including + and - symbols
// @author       dasimple
// @match        *://steamcommunity.com/*/tradehistory*
// @grant        none
// @run-at       document-end
// @icon         https://images.icon-icons.com/3261/PNG/512/steam_logo_icon_206670.png
// ==/UserScript==

(function() {
    'use strict';

    // Add CSS to enable wrapping and style the layout
    const style = document.createElement('style');
    style.textContent = `
        .tradehistory_items {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: 10px;
        }
        .tradehistory_items_plusminus {
            flex: 0 0 auto;
            font-size: 16px;
            font-weight: bold;
            margin-right: 5px;
        }
        .tradehistory_items_group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            flex: 1;
        }
        .history_item {
            flex: 0 0 auto;
        }
    `;
    document.head.appendChild(style);

    // Function to process items and combine duplicates while preserving details
    function combineItems(container, isReceived) {
        const itemsGroup = container.querySelector('.tradehistory_items_group');
        if (!itemsGroup || !itemsGroup.children.length) return;

        // Collect all item names, links, and details
        const itemMap = new Map();
        const itemElements = Array.from(itemsGroup.children);
        itemElements.forEach(item => {
            let nameElement = item.querySelector('.history_item_name');
            if (!nameElement) return;

            let itemName = nameElement.textContent.trim();
            let link = item.getAttribute('href') || ''; // Preserve link for received items
            let details = itemMap.get(itemName) || {
                count: 0,
                links: [],
                style: nameElement.getAttribute('style') || ''
            };
            details.count += 1;
            if (isReceived && link) details.links.push(link); // Store original link
            if (isReceived) {
                let img = item.querySelector('img.tradehistory_received_item_img');
                if (img && !details.imgSrc) {
                    details.imgSrc = img.getAttribute('src');
                    details.imgStyle = img.getAttribute('style') || '';
                }
            }
            itemMap.set(itemName, details);
        });

        // Generate new HTML for combined items
        let newContent = '';
        for (let [name, details] of itemMap) {
            if (isReceived) {
                // Use the first link for the combined item, maintaining hover functionality
                let firstLink = details.links[0] || '';
                newContent += `<a class="history_item economy_item_hoverable" href="${firstLink}">
                    <img src="${details.imgSrc}" style="${details.imgStyle}" class="tradehistory_received_item_img">
                    <span class="history_item_name" style="${details.style}">${name} x${details.count}</span>
                </a>`;
            } else {
                newContent += `<span class="history_item economy_item_hoverable">
                    <span class="history_item_name" style="${details.style}">${name} x${details.count}</span>
                </span>`;
            }
        }

        // Replace the original content
        itemsGroup.innerHTML = newContent;
    }

    // Process each trade row
    const tradeRows = document.querySelectorAll('.tradehistoryrow');
    tradeRows.forEach(row => {
        // Process received items
        let receivedItems = row.querySelector('.tradehistory_items_withimages');
        if (receivedItems) {
            combineItems(receivedItems, true);
        }

        // Process given items
        let givenItems = row.querySelector('.tradehistory_items_noimages');
        if (givenItems) {
            combineItems(givenItems, false);
        }
    });
})();
