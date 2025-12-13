/**
 * Visual PC-to-PC Hamming Demo
 */

const DEFAULT_MSG = "OK";

// --- STATE ---
const state = {
    text: DEFAULT_MSG,
    packets: [],
    corruptedPacketIndex: -1,
    currentStep: 0
};

// --- DOM ELEMENTS ---
const els = {
    userInput: document.getElementById('user-input'),
    senderBits: document.getElementById('sender-bits'),
    movingBits: document.getElementById('moving-bits'),
    receiverBits: document.getElementById('receiver-bits'),

    corruptedMsg: document.getElementById('corrupted-msg'),
    finalMsg: document.getElementById('final-msg'),

    lightning: document.getElementById('lightning'),
    explanation: document.getElementById('explanation-text'),

    opsPanel: document.getElementById('operations-panel'),
    valP1: document.getElementById('val-p1'),
    resP1: document.getElementById('res-p1'),
    valP2: document.getElementById('val-p2'),
    resP2: document.getElementById('res-p2'),
    valP4: document.getElementById('val-p4'),
    resP4: document.getElementById('res-p4'),
    errorPosVal: document.getElementById('error-pos-val'),

    btn1: document.getElementById('btn-step1'),
    btn2: document.getElementById('btn-step2'),
    btn3: document.getElementById('btn-step3'),
    btn4: document.getElementById('btn-step4'),
    btn5: document.getElementById('btn-step5'),
    btnReset: document.getElementById('btn-reset')
};

// --- LOGIC ---
function getLowNibble(char) {
    const code = char.charCodeAt(0);
    const binary = code.toString(2).padStart(8, '0');
    return binary.substring(4, 8).split('').map(Number);
}

function encodeHamming(dataBits) {
    const d = dataBits;
    const b = new Array(7).fill(0);
    b[2] = d[0]; b[4] = d[1]; b[5] = d[2]; b[6] = d[3];
    b[0] = b[2] ^ b[4] ^ b[6];
    b[1] = b[2] ^ b[5] ^ b[6];
    b[3] = b[4] ^ b[5] ^ b[6];
    return b;
}

function bitsToHexChar(bits) {
    const d = [bits[2], bits[4], bits[5], bits[6]];
    const val = parseInt(d.join(''), 2);
    return val.toString(16).toUpperCase();
}

// --- RENDER HELPERS ---
function createBit(val, index) {
    const el = document.createElement('div');
    const isParity = (index === 0 || index === 1 || index === 3);
    el.className = `bit ${isParity ? 'parity' : 'data'}`;
    el.textContent = val;
    return el;
}

function renderPacketsToContainer(container, type) {
    container.innerHTML = '';
    state.packets.forEach((pkt, pIdx) => {
        const group = document.createElement('div');
        group.className = 'packet-group';

        const label = document.createElement('div');
        label.className = 'packet-char-label';
        label.textContent = pkt.char;
        group.appendChild(label);

        const bitsRow = document.createElement('div');
        bitsRow.className = 'packet-bits';

        const bitsToUse = (type === 'received') ? pkt.receivedBits : pkt.encodedBits;

        bitsToUse.forEach((bit, bIdx) => {
            const el = createBit(bit, bIdx);
            if (type === 'received' && pIdx === state.corruptedPacketIndex && bIdx === pkt.errorIdx) {
                el.classList.add('error');
            }
            bitsRow.appendChild(el);
        });

        group.appendChild(bitsRow);
        container.appendChild(group);
    });
}

// --- STEPS ---

function init() {
    state.currentStep = 0;
    state.corruptedPacketIndex = -1;
    state.packets = [];

    let text = els.userInput.value.toUpperCase();
    if (text.length === 0) { text = DEFAULT_MSG; els.userInput.value = DEFAULT_MSG; }
    state.text = text;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const dBits = getLowNibble(char);
        const eBits = encodeHamming(dBits);
        state.packets.push({
            char: char,
            dataBits: dBits,
            encodedBits: eBits,
            receivedBits: [...eBits],
            errorIdx: -1
        });
    }

    // UI Reset
    els.movingBits.innerHTML = '';
    els.receiverBits.innerHTML = '';
    els.corruptedMsg.textContent = '-';
    els.finalMsg.textContent = '-';
    els.opsPanel.classList.add('hidden');
    els.explanation.textContent = `Ready to send "${state.text}".`;

    renderPacketsToContainer(els.senderBits, 'encoded');

    els.btn1.disabled = false;
    els.btn2.disabled = true;
    els.btn3.disabled = true;
    els.btn4.disabled = true;
    els.btn5.disabled = true;
    els.userInput.disabled = false;
}

// INPUT LISTENER
els.userInput.addEventListener('input', (e) => {
    const val = e.target.value.toUpperCase();
    if (val.length === 0) return;
    state.text = val;
    state.packets = [];

    for (let i = 0; i < val.length; i++) {
        const char = val[i];
        const dBits = getLowNibble(char);
        const eBits = encodeHamming(dBits);
        state.packets.push({
            char: char,
            dataBits: dBits,
            encodedBits: eBits,
            receivedBits: [...eBits],
            errorIdx: -1
        });
    }
    renderPacketsToContainer(els.senderBits, 'encoded');
    els.explanation.textContent = `Ready to send "${state.text}".`;
});

// STEP 1: SEND
els.btn1.addEventListener('click', () => {
    els.btn1.disabled = true;
    els.userInput.disabled = true;
    els.explanation.textContent = "Sending packets...";

    renderPacketsToContainer(els.movingBits, 'encoded');

    // Start Position
    els.movingBits.style.transition = 'none';
    els.movingBits.style.left = '0%';
    els.movingBits.style.transform = 'translate(-100%, -50%)';
    els.movingBits.style.opacity = '1';

    void els.movingBits.offsetWidth;

    // Animate to Center
    els.movingBits.style.transition = 'left 1.5s ease-in-out';
    els.movingBits.style.left = '50%';
    els.movingBits.style.transform = 'translate(-50%, -50%)';

    setTimeout(() => {
        els.btn2.disabled = false;
        els.explanation.textContent = "Packets in network. Add noise!";
    }, 1500);
});

// STEP 2: NOISE
els.btn2.addEventListener('click', () => {
    els.btn2.disabled = true;

    const pIdx = Math.floor(Math.random() * state.packets.length);
    state.corruptedPacketIndex = pIdx;

    const bIdx = Math.floor(Math.random() * 7);
    state.packets[pIdx].errorIdx = bIdx;
    state.packets[pIdx].receivedBits[bIdx] ^= 1;

    // VISUAL: Move lightning to target packet
    const group = els.movingBits.children[pIdx];
    group.style.position = 'relative'; // Ensure absolute child positions relative to this
    group.appendChild(els.lightning);

    // Adjust lightning style for local positioning
    els.lightning.style.top = '-40px'; // Hover above packet
    els.lightning.style.left = '50%';
    // Animation 'flash' handles the transform (translate -50%, -50%)

    els.lightning.classList.remove('hidden');
    els.lightning.classList.add('flash');

    setTimeout(() => {
        // Visual Update
        const bitsRow = group.querySelector('.packet-bits');
        const targetEl = bitsRow.children[bIdx];

        targetEl.textContent = state.packets[pIdx].receivedBits[bIdx];
        targetEl.classList.add('error');

        els.explanation.textContent = `Noise hit "${state.packets[pIdx].char}"!`;

        setTimeout(() => {
            els.movingBits.style.left = '100%';
            els.movingBits.style.transform = 'translate(0%, -50%)';

            setTimeout(() => {
                renderPacketsToContainer(els.receiverBits, 'received');

                let corruptStr = "";
                state.packets.forEach(p => corruptStr += bitsToHexChar(p.receivedBits));
                els.corruptedMsg.textContent = corruptStr;

                els.movingBits.style.opacity = '0';
                els.btn3.disabled = false;

                // Reset Lightning
                document.querySelector('.network-path').appendChild(els.lightning);
                els.lightning.classList.add('hidden');
                els.lightning.style.top = ''; // Clear inline styles
                els.lightning.style.left = '';
            }, 1500);
        }, 1000);
    }, 300);

    setTimeout(() => {
        els.lightning.classList.remove('flash');
        // The lightning is hidden and moved back to network-path in the nested setTimeout
        // This timeout ensures the flash animation class is removed.
    }, 1000);
});

// STEP 3: DETECT
els.btn3.addEventListener('click', () => {
    els.btn3.disabled = true;
    els.opsPanel.classList.remove('hidden');

    const pIdx = state.corruptedPacketIndex;
    const pkt = state.packets[pIdx];
    const b = pkt.receivedBits;

    const p1 = b[0] ^ b[2] ^ b[4] ^ b[6];
    els.valP1.textContent = `[${b[0]}, ${b[2]}, ${b[4]}, ${b[6]}]`;
    els.resP1.textContent = p1 === 0 ? "OK" : "ERR";
    els.resP1.className = `op-result ${p1 === 0 ? 'ok' : 'err'}`;

    const p2 = b[1] ^ b[2] ^ b[5] ^ b[6];
    els.valP2.textContent = `[${b[1]}, ${b[2]}, ${b[5]}, ${b[6]}]`;
    els.resP2.textContent = p2 === 0 ? "OK" : "ERR";
    els.resP2.className = `op-result ${p2 === 0 ? 'ok' : 'err'}`;

    const p4 = b[3] ^ b[4] ^ b[5] ^ b[6];
    els.valP4.textContent = `[${b[3]}, ${b[4]}, ${b[5]}, ${b[6]}]`;
    els.resP4.textContent = p4 === 0 ? "OK" : "ERR";
    els.resP4.className = `op-result ${p4 === 0 ? 'ok' : 'err'}`;

    const syndrome = (p4 * 4) + (p2 * 2) + (p1 * 1);
    els.errorPosVal.textContent = syndrome;

    // Highlight
    const group = els.receiverBits.children[pIdx];
    const bitsRow = group.querySelector('.packet-bits');
    bitsRow.children[syndrome - 1].classList.add('highlight');

    els.explanation.textContent = `Detected error in "${pkt.char}" at bit ${syndrome}.`;
    els.btn4.disabled = false;
});

// STEP 4: CORRECT
els.btn4.addEventListener('click', () => {
    els.btn4.disabled = true;

    const pIdx = state.corruptedPacketIndex;
    const pkt = state.packets[pIdx];
    const bIdx = pkt.errorIdx;

    pkt.receivedBits[bIdx] ^= 1;

    const group = els.receiverBits.children[pIdx];
    const bitsRow = group.querySelector('.packet-bits');
    const el = bitsRow.children[bIdx];

    el.style.transform = "rotateY(360deg)";
    el.style.backgroundColor = "#22c55e";
    el.classList.remove('error', 'highlight');
    el.textContent = pkt.receivedBits[bIdx];

    els.explanation.textContent = "Error corrected!";
    els.btn5.disabled = false;
});

// STEP 5: RESULT
els.btn5.addEventListener('click', () => {
    els.btn5.disabled = true;
    els.finalMsg.textContent = state.text;
    els.explanation.textContent = "Message restored!";
});

els.btnReset.addEventListener('click', () => {
    els.movingBits.style.transition = 'none';
    els.movingBits.style.left = '0%';
    setTimeout(() => {
        els.movingBits.style.transition = 'left 1.5s linear';
        init();
    }, 50);
});

init();
