/* Сертификат Практикума AI Цех: сборка макета, вписывание в экран, файлы PNG и PDF.
   Один модуль на три места: экран участника (live/), отдельная страница (certificate/)
   и панель ведущего. Картинку рисует html2canvas прямо на устройстве человека, PDF
   собирается из неё через jsPDF. Обе библиотеки лежат у нас в vendor/, без внешних CDN. */
(function () {
  'use strict';

  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var BASE = scriptSrc ? scriptSrc.replace(/[^/]*$/, '') : '';
  var VENDOR = BASE ? BASE.replace(/certificate\/$/, 'vendor/') : '../vendor/';

  var DEFAULTS = {
    name: 'Имя Фамилия',
    serial: 'NV·AIT·2026·018',
    date: '3 октября 2026'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function clean(value, fallback, limit) {
    var safe = String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, limit || 80);
    return safe || fallback;
  }

  function normalise(data) {
    data = data || {};
    return {
      name: clean(data.name, DEFAULTS.name, 70),
      serial: clean(data.serial, DEFAULTS.serial, 40).toUpperCase(),
      date: clean(data.date, DEFAULTS.date, 40)
    };
  }

  function markup(d) {
    var size = d.name.length > 30 ? ' is-extra-long' : d.name.length > 22 ? ' is-long' : '';
    return [
      '<div class="nvc-ring nvc-ring--far" aria-hidden="true"></div>',
      '<div class="nvc-ring nvc-ring--near" aria-hidden="true"></div>',
      '<div class="nvc-plate" aria-hidden="true"></div>',
      '<div class="nvc-plate-label" aria-hidden="true">AI ЦЕХ · PRACTICUM · 2026</div>',
      '<div class="nvc-micro-grid" aria-hidden="true"></div>',
      '<div class="nvc-content">',
      '<div class="nvc-header">',
      '<div>',
      '<div class="nvc-brand-line"><span class="nvc-brand-dot" aria-hidden="true"></span><strong>neovida</strong><span class="nvc-brand-separator">·</span><span>Нейропросвещение</span></div>',
      '<div class="nvc-header-kicker">Практика, в которой идея становится работающей системой</div>',
      '</div>',
      '<div class="nvc-issue">Дата выдачи<strong>', escapeHtml(d.date), '</strong></div>',
      '</div>',
      '<div class="nvc-main">',
      '<div class="nvc-eyebrow">Сертификат о завершении</div>',
      '<div class="nvc-course">Практикум <span>AI Цех</span></div>',
      '<div class="nvc-rule" aria-hidden="true"></div>',
      '<div class="nvc-confirmation">Настоящим подтверждается, что</div>',
      '<div class="nvc-recipient', size, '">', escapeHtml(d.name), '</div>',
      '<div class="nvc-name-rule" aria-hidden="true"></div>',
      '<div class="nvc-statement">завершил(а) <strong>восемь занятий онлайн-практикума AI Цех</strong>, прошёл(а) путь от идеи и личного проекта до сборки и публикации ИИ-продукта, освоил(а) автоматизацию и создание автономных агентов, работающих 24/7 под поставленные задачи.</div>',
      '</div>',
      '<div class="nvc-footer">',
      '<div class="nvc-signature">',
      '<img class="nvc-signature-image" src="', BASE, 'signature.png" alt="Подпись Альберта Валеева">',
      '<div class="nvc-signature-line"></div>',
      '<div class="nvc-signature-name">Альберт Валеев</div>',
      '<div class="nvc-signature-role">основатель neovida.ai · ведущий практикума</div>',
      '</div>',
      '<div class="nvc-stamp-wrap"><img class="nvc-stamp" src="', BASE, 'stamp.png" alt="Печать neovida"></div>',
      '<div class="nvc-meta">',
      '<div class="nvc-meta-label">Программа</div>',
      '<div class="nvc-meta-value">8 занятий · онлайн-практикум</div>',
      '<div class="nvc-serial">', escapeHtml(d.serial), '</div>',
      '</div>',
      '</div>',
      '</div>',
      '<div class="nvc-bottom-code">neovida · AI Цех · онлайн</div>'
    ].join('');
  }

  function create(data) {
    var d = normalise(data);
    var el = document.createElement('div');
    el.className = 'nvc';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Сертификат Практикума AI Цех: ' + d.name + ', ' + d.serial);
    el.innerHTML = markup(d);
    el.__nvc = d;
    layout(el);
    return el;
  }

  // Вертикальная подпись: длина строки известна только после загрузки шрифта.
  function layout(el) {
    var label = el && el.querySelector('.nvc-plate-label');
    if (!label) return;
    label.style.transform = 'translateY(' + label.offsetWidth + 'px) rotate(-90deg)';
  }

  function imagesReady(el) {
    var images = Array.prototype.slice.call(el.querySelectorAll('img'));
    return Promise.all(images.map(function (img) {
      if (img.complete && img.naturalWidth) return true;
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 8000);
      });
    }));
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var faces = [
      '700 10pt "DM Sans"', '500 10pt "DM Sans"', '600 10pt "DM Sans"', '400 10pt "DM Sans"',
      '500 40pt "Fraunces"', '500 8pt "DM Mono"', '600 8pt "DM Mono"',
      '400 10pt Arimo', '700 10pt Arimo', '400 10pt Tinos', '400 40pt "PT Serif"'
    ];
    var sample = 'AaЯя 0123';
    var loads = faces.map(function (face) {
      return document.fonts.load(face, sample).catch(function () { return null; });
    });
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 6000); });
    return Promise.race([Promise.all(loads).then(function () { return document.fonts.ready; }), timeout]);
  }

  function whenReady(el) {
    return Promise.all([fontsReady(), imagesReady(el)]).then(function () {
      layout(el);
      return el;
    });
  }

  // Вписать макет A4 в ширину контейнера (телефон, колонка экрана).
  function fit(stage, el) {
    if (!stage || !el) return;
    var natural = el.offsetWidth || 1122.5;
    var naturalHeight = el.offsetHeight || 793.7;
    var available = stage.clientWidth || natural;
    var scale = Math.min(1, available / natural);
    el.style.transformOrigin = '0 0';
    el.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    stage.style.height = Math.ceil(naturalHeight * scale) + 'px';
  }

  var scriptPromises = {};
  function loadScript(src) {
    if (!scriptPromises[src]) {
      scriptPromises[src] = new Promise(function (resolve, reject) {
        var tag = document.createElement('script');
        tag.src = src;
        tag.async = true;
        tag.onload = resolve;
        tag.onerror = function () {
          delete scriptPromises[src];
          reject(new Error('Не загрузилась библиотека ' + src));
        };
        document.head.appendChild(tag);
      });
    }
    return scriptPromises[src];
  }

  function ensureLibs() {
    return Promise.all([
      window.html2canvas ? null : loadScript(VENDOR + 'html2canvas.min.js'),
      window.jspdf && window.jspdf.jsPDF ? null : loadScript(VENDOR + 'jspdf.umd.min.js')
    ]);
  }

  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isTouch() {
    return isIOS() || /Android/i.test(navigator.userAgent || '');
  }

  // Рисуем отдельную, не масштабированную копию сертификата за краем экрана.
  function renderCanvas(data, options) {
    var opts = options || {};
    var d = normalise(data);
    var hostId = 'nvc-export-' + Math.random().toString(36).slice(2, 9);
    var host = document.createElement('div');
    host.id = hostId;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;width:297mm;height:210mm;overflow:hidden;pointer-events:none;z-index:-1;';
    var el = create(d);
    host.appendChild(el);
    document.body.appendChild(host);
    var scale = opts.scale || (isTouch() ? 2.4 : 2.8);
    return Promise.all([ensureLibs(), whenReady(el)]).then(function () {
      return window.html2canvas(el, {
        scale: scale,
        backgroundColor: '#f1e9dc',
        useCORS: true,
        logging: false,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1400,
        windowHeight: 1000,
        onclone: function (doc) {
          var clone = doc.getElementById(hostId);
          if (clone) {
            clone.style.position = 'absolute';
            clone.style.left = '0px';
            clone.style.top = '0px';
          }
        }
      });
    }).then(function (canvas) {
      host.remove();
      return canvas;
    }, function (error) {
      host.remove();
      throw error;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error('Пустой файл'));
        }, type, quality);
      } else {
        try {
          var dataUrl = canvas.toDataURL(type, quality);
          var bytes = atob(dataUrl.split(',')[1]);
          var buffer = new Uint8Array(bytes.length);
          for (var i = 0; i < bytes.length; i += 1) buffer[i] = bytes.charCodeAt(i);
          resolve(new Blob([buffer], { type: type }));
        } catch (error) { reject(error); }
      }
    });
  }

  // PNG для картинки и PDF A4 (альбомный) из той же отрисовки.
  function makeFiles(data, options) {
    return renderCanvas(data, options).then(function (canvas) {
      var pngPromise = canvasToBlob(canvas, 'image/png');
      var jpegUrl = canvas.toDataURL('image/jpeg', 0.93);
      var JsPDF = window.jspdf.jsPDF;
      var pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
      var d = normalise(data);
      pdf.setProperties({ title: 'Сертификат · ' + d.name + ' · AI Цех', subject: d.serial, author: 'neovida · Нейропросвещение' });
      pdf.addImage(jpegUrl, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
      var pdfBlob = pdf.output('blob');
      return pngPromise.then(function (pngBlob) {
        return { png: pngBlob, pdf: pdfBlob, width: canvas.width, height: canvas.height };
      });
    });
  }

  function filename(data, ext) {
    var d = normalise(data);
    var who = d.name.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
    var number = (d.serial.match(/(\d{3,})\s*$/) || [])[1] || '';
    return 'Сертификат-AI-Цех-' + who + (number ? '-' + number : '') + '.' + ext;
  }

  function downloadLink(blob, name) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      link.remove();
      URL.revokeObjectURL(url);
    }, 60000);
    return 'downloaded';
  }

  // Вызывать синхронно из обработчика нажатия: на iPhone «Поделиться» требует жеста.
  function deliver(blob, name) {
    var file = null;
    try { file = new File([blob], name, { type: blob.type }); } catch (error) { file = null; }
    if (isIOS() && file && navigator.canShare && navigator.share) {
      var can = false;
      try { can = navigator.canShare({ files: [file] }); } catch (error) { can = false; }
      if (can) {
        return navigator.share({ files: [file], title: name }).then(function () {
          return 'shared';
        }, function (error) {
          if (error && error.name === 'AbortError') return 'cancelled';
          return downloadLink(blob, name);
        });
      }
    }
    return Promise.resolve(downloadLink(blob, name));
  }

  window.NVCert = {
    defaults: DEFAULTS,
    normalise: normalise,
    create: create,
    layout: layout,
    whenReady: whenReady,
    fit: fit,
    ensureLibs: ensureLibs,
    makeFiles: makeFiles,
    filename: filename,
    deliver: deliver,
    isIOS: isIOS,
    isTouch: isTouch
  };
}());
