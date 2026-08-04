/**
 * 太行遗产地图 — 第六章 功能一
 * 读取 GeoJSON，用 Leaflet L.marker 打点，按 properties.level 选择图标，
 * 点击弹出档案卡片（bindPopup 渲染 HTML）。
 *
 * 依赖：Leaflet CSS/JS 已由 index.html 加载
 */

// ============================================================
//  1. Pin 图标工厂
// ============================================================

var pinIcons = {
  A: L.icon({
    iconUrl: 'assets/pins/pin-A.png',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -50],
  }),
  B: L.icon({
    iconUrl: 'assets/pins/pin-B.png',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -50],
  }),
  C: L.icon({
    iconUrl: 'assets/pins/pin-C.png',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -50],
  }),
};

/**
 * 根据 level 获取对应图标，默认使用 C 级图标
 * @param {string} level - A / B / C
 * @returns {L.Icon}
 */
function getPinIcon(level) {
  return pinIcons[level] || pinIcons.C;
}

// ============================================================
//  2. 时间线 HTML 生成
// ============================================================

/**
 * 将 properties.timeline 用全角竖线（｜）拆分为横向时间线 HTML。
 * 每段可能是纯年份，也可能是 "年份｜事件" 组合，本函数自动将
 * 奇数位置当时间节点、偶数位置当事件描述。
 *
 * @param {string} timelineStr - 以 ｜ 分隔的时间线字符串
 * @returns {string} 时间线 HTML
 */
function buildTimelineHTML(timelineStr) {
  if (!timelineStr || typeof timelineStr !== 'string') {
    return '';
  }

  var segments = timelineStr.split('｜'); // 全角竖线 U+FF5C
  if (segments.length === 0) return '';

  var items = [];
  for (var i = 0; i < segments.length; i++) {
    var text = segments[i].trim();
    if (!text) continue;
    items.push(text);
  }

  if (items.length === 0) return '';

  var html = '<div class="heritage-card__timeline">';
  html += '<div class="heritage-card__timeline-title">📅 历史时间线</div>';
  html += '<div class="heritage-card__timeline-track">';

  for (var j = 0; j < items.length; j++) {
    var isYear = (j % 2 === 0); // 偶数位视作年份节点
    html += '<div class="heritage-card__timeline-item">';
    html += '<div class="heritage-card__timeline-line"></div>';
    html += '<div class="heritage-card__timeline-dot"></div>';
    if (isYear) {
      html += '<div class="heritage-card__timeline-year">' + escapeHTML(items[j]) + '</div>';
    } else {
      html += '<div class="heritage-card__timeline-event">' + escapeHTML(items[j]) + '</div>';
    }
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

// ============================================================
//  3. 照片区 HTML 生成
// ============================================================

/**
 * @param {string} photoNow  - 现状照片文件名
 * @param {string} photoHist - 历史照片文件名
 * @returns {string} 照片区 HTML
 */
function buildPhotosHTML(photoNow, photoHist) {
  var nowSrc = photoNow ? 'assets/photos/now/' + photoNow : '';
  var histSrc = photoHist ? 'assets/photos/history/' + photoHist : '';

  var html = '<div class="heritage-card__photos">';

  html += '<div class="heritage-card__photo">';
  html += '<div class="heritage-card__photo-label">现状照片</div>';
  html += '<img class="heritage-card__photo-img" src="' + (nowSrc || '') + '"';
  html += ' alt="现状照片"';
  if (!nowSrc) {
    html += ' style="background:#e8ddd0;display:flex;align-items:center;justify-content:center;"';
  }
  html += ' onerror="this.style.display=\'none\'">';
  html += '</div>';

  html += '<div class="heritage-card__photo">';
  html += '<div class="heritage-card__photo-label">历史照片</div>';
  html += '<img class="heritage-card__photo-img" src="' + (histSrc || '') + '"';
  html += ' alt="历史照片"';
  if (!histSrc) {
    html += ' style="background:#e8ddd0;display:flex;align-items:center;justify-content:center;"';
  }
  html += ' onerror="this.style.display=\'none\'">';
  html += '</div>';

  html += '</div>';
  return html;
}

// ============================================================
//  4. 卡片 HTML 生成（核心）
// ============================================================

/**
 * 根据一个 GeoJSON feature 的 properties 渲染完整的档案卡片 HTML。
 *
 * @param {Object} props - feature.properties
 * @returns {string} 完整档案卡片 HTML
 */
function buildCardHTML(props) {
  var level = (props.level || '').toUpperCase();
  var levelClass = 'heritage-card__level--' + (level || 'C');

  var fields = [
    { label: '名称',   value: props.name    },
    { label: '地址',   value: props.address  },
    { label: '类型',   value: props.type     },
    { label: '年份',   value: props.year     },
    { label: '人物',   value: props.people   },
    { label: '保护',   value: props.protect  },
    { label: '教育',   value: props.edu      },
    { label: '现状',   value: props.status   },
  ];

  var html = '<div class="heritage-card">';

  // -- 头部：名称 + 等级标识 --
  html += '<div class="heritage-card__header">';
  html += '<h2 class="heritage-card__title">' + escapeHTML(props.name || '（未命名）') + '</h2>';
  html += '<span class="heritage-card__level ' + levelClass + '">' + escapeHTML(level || 'C') + ' 级</span>';
  html += '</div>';

  // -- 信息字段 --
  html += '<div class="heritage-card__body">';
  html += '<div class="heritage-card__fields">';
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    if (f.value) {
      html += '<div class="heritage-card__field">';
      html += '<span class="heritage-card__field-label">' + escapeHTML(f.label) + '</span>';
      html += '<span class="heritage-card__field-value">' + escapeHTML(String(f.value)) + '</span>';
      html += '</div>';
    }
  }
  html += '</div>';

  // -- 简介 --
  if (props.blurb) {
    html += '<div class="heritage-card__blurb">' + escapeHTML(props.blurb) + '</div>';
  }

  // -- 照片区 --
  html += buildPhotosHTML(props.photo_now, props.photo_hist);

  // -- 时间线 --
  html += buildTimelineHTML(props.timeline);

  html += '</div>'; // .heritage-card__body
  html += '</div>'; // .heritage-card

  return html;
}

// ============================================================
//  5. HTML 转义工具
// ============================================================

/**
 * 对用户数据做基本 HTML 转义，防止 XSS
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
//  6. 核心函数 —— 第六章 功能一
// ============================================================

/**
 * 读取 GeoJSON 的每个 feature，用 L.marker 打点，图标按 properties.level
 * 选 pin-A/B/C.png；点击时 bindPopup 渲染档案卡片 HTML。
 *
 * 每个 marker 上会附加：
 *   marker._heritageIndex  — 在 features 数组中的序号
 *   marker._heritageFeature — 对应的 GeoJSON feature 对象
 *
 * @param {L.Map}       map      - Leaflet 地图实例
 * @param {Object}      geojson  - 已解析的 GeoJSON FeatureCollection 对象
 * @param {L.FeatureGroup} [layerGroup] - 可选，将 marker 添加到指定 FeatureGroup
 * @returns {L.FeatureGroup} 包含所有 marker 的图层组
 */
function renderHeritageMarkers(map, geojson, layerGroup) {
  var group = layerGroup || L.featureGroup();

  if (!geojson || !geojson.features || !geojson.features.length) {
    console.warn('renderHeritageMarkers: GeoJSON 中没有 features');
    return group;
  }

  for (var i = 0; i < geojson.features.length; i++) {
    var feature = geojson.features[i];
    var geom = feature.geometry;
    var props = feature.properties || {};

    // 只处理 Point 类型的几何
    if (!geom || geom.type !== 'Point') {
      console.warn('renderHeritageMarkers: 跳过非 Point feature, index=', i);
      continue;
    }

    var coords = geom.coordinates; // [lng, lat]
    var latlng = L.latLng(coords[1], coords[0]);

    var level = (props.level || 'C').toUpperCase();
    var icon = getPinIcon(level);

    var marker = L.marker(latlng, { icon: icon });

    // 在 marker 上挂载 feature 信息，供侧边栏联动使用
    marker._heritageIndex = i;
    marker._heritageFeature = feature;

    var cardHTML = buildCardHTML(props);
    marker.bindPopup(cardHTML, {
      maxWidth: 440,
      minWidth: 380,
      className: 'heritage-popup',
    });

    marker.addTo(group);
  }

  return group;
}
