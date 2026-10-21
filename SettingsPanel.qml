import QtQuick
import QtQuick.Window
import QtQuick.Controls as Controls
import qs.Commons as Commons
import qs.Ui
import "Model.js" as Model

FocusScope {
    id: panel
    property int diameter: 240
    property bool animation: true
    property string shortcut: "SUPER + ALT + O"
    property bool desktopRightClick: false
    property var actions: []
    property var actionOrigins: []
    property var childOrigins: []
    property var original: ({})
    property var choices: []
    property var appLibrary: null
    property string error: ""
    property bool busy: false
    property bool setupFailed: false
    property int tab: 0
    property int selectedSlot: 0
    property int editingSlot: -1
    property real maximumHeight: 800
    property real openingHeight: 0
    property alias editor: actionEditor
    readonly property var positions: actions.length === 8 ? ["Top", "Upper right", "Right", "Lower right", "Bottom", "Lower left", "Left", "Upper left"]
        : actions.length === 7 ? ["Top", "Upper right", "Right", "Lower right", "Lower left", "Left", "Upper left"]
        : ["Top", "Upper right", "Lower right", "Bottom", "Lower left", "Upper left"]
    readonly property bool wide: width >= Commons.Style.space(580)
    readonly property var shortcutCheck: Model.shortcut(shortcut)
    readonly property var filteredChoices: actionEditor.filteredChoices
    implicitHeight: Math.min(maximumHeight, openingHeight || header.height + bodyColumn.height + footer.height + Commons.Style.space(64))
    height: implicitHeight
    signal saveRequested()
    signal canceled()
    signal retrySetup()

    function begin(config, catalog) {
        original = JSON.parse(JSON.stringify(config));
        diameter = config.diameter; animation = config.animation;
        shortcut = config.shortcut || "SUPER + ALT + O"; desktopRightClick = config.desktopRightClick === true;
        actions = JSON.parse(JSON.stringify(config.actions)); choices = catalog;
        actionOrigins = actions.map(function(a, i) { return i; });
        childOrigins = actions.map(function(a) { return a.children ? a.children.map(function(c, i) { return i; }) : []; });
        tab = 0; selectedSlot = 0; editingSlot = -1; body.contentY = 0;
        openingHeight = 0;
        Qt.callLater(function() { slotNavigation.forceActiveFocus(); });
    }
    function draft() { return { diameter: diameter, animation: animation, actions: actions,
        shortcut: shortcutCheck.error ? shortcut : shortcutCheck.value, desktopRightClick: desktopRightClick,
        actionOrigins: actionOrigins, childOrigins: childOrigins }; }
    function appIcon(action) {
        if (!action.desktopId) return "";
        for (var i = 0; i < choices.length; i++)
            if (choices[i].action.desktopId === action.desktopId) return choices[i].iconSource || "";
        return "";
    }
    function selectTab(index) {
        tab = index; body.contentY = 0;
        Qt.callLater(function() {
            if (index === 0) slotNavigation.forceActiveFocus();
            else if (index === 1) sizeControl.forceActiveFocus();
            else openingKey.forceActiveFocus();
        });
    }
    function editSlot(index) {
        if (busy) return;
        editingSlot = index; body.contentY = 0;
        actionEditor.begin(actions[index] || null, choices, 0, childOrigins[index] || []);
    }
    function backToSlots() {
        selectedSlot = Math.min(editingSlot, actions.length - 1); editingSlot = -1;
        body.contentY = 0; slotNavigation.forceActiveFocus();
    }
    function addSlot() { if (actions.length < 8) editSlot(actions.length); }
    function removeSlot(index) {
        if (busy || actions.length <= 6 || index < 0 || index >= actions.length) return;
        var copy = actions.slice(), order = actionOrigins.slice(), childOrder = childOrigins.slice();
        copy.splice(index, 1); order.splice(index, 1); childOrder.splice(index, 1);
        actions = copy; actionOrigins = order; childOrigins = childOrder;
        selectedSlot = Math.min(index, actions.length - 1); slotNavigation.forceActiveFocus();
    }
    function chooseAction(value, childrenOrder) {
        var copy = actions.slice(), order = actionOrigins.slice(), childOrder = childOrigins.slice();
        if (editingSlot === actions.length) order.push(-1);
        copy[editingSlot] = value; childOrder[editingSlot] = childrenOrder || [];
        actions = copy; actionOrigins = order; childOrigins = childOrder; backToSlots();
    }
    function moveSlot(from, to) {
        if (busy || from < 0 || to < 0 || from >= actions.length || to >= actions.length) return;
        actions = Model.move(actions, from, to); actionOrigins = Model.move(actionOrigins, from, to); childOrigins = Model.move(childOrigins, from, to);
        selectedSlot = to; slotNavigation.forceActiveFocus();
    }
    function toggleModifier(modifier) {
        var checked = Model.shortcut(shortcut), mask = checked.error ? 72 : checked.mask;
        mask ^= modifier;
        var tokens = ["SUPER"];
        if (mask & 4) tokens.push("CTRL"); if (mask & 8) tokens.push("ALT"); if (mask & 1) tokens.push("SHIFT");
        tokens.push(openingKey.text.toUpperCase() || "O"); shortcut = tokens.join(" + ");
    }
    function changeKey(value) {
        var tokens = shortcut.split("+"); tokens[tokens.length - 1] = value.toUpperCase().trim(); shortcut = tokens.join(" + ");
    }
    function requestSave() { if (!busy && !shortcutCheck.error && editingSlot < 0) saveRequested(); }
    function previewStatus() {
        var p = preview.mapToItem(panel, 0, 0);
        return { x: p.x, y: p.y, diameter: preview.width, dragging: preview.dragging, selected: selectedSlot };
    }
    function layoutStatus() {
        return { bodyX: body.x, bodyY: body.y, bodyWidth: body.width, bodyHeight: body.height, scroll: body.contentY,
            tabY: header.y + header.height - tabRow.height / 2 };
    }
    function controls() {
        var rows = [];
        function visit(item) {
            if (!item.visible) return;
            if (item.objectName && item.objectName.indexOf("orb-") === 0) {
                var p = item.mapToItem(panel, 0, 0);
                rows.push({ name: item.objectName, x: p.x, y: p.y, width: item.width, height: item.height, enabled: item.enabled });
            }
            for (var i = 0; i < item.children.length; i++) visit(item.children[i]);
        }
        visit(panel); return rows;
    }
    function reveal(item) {
        var p = item.mapToItem(body.contentItem, 0, 0);
        body.contentY = Math.max(0, Math.min(body.contentHeight - body.height,
            p.y < body.contentY ? p.y : p.y + item.height > body.contentY + body.height ? p.y + item.height - body.height : body.contentY));
    }
    Keys.onPressed: event => {
        if (busy) { event.accepted = true; return; }
        if (editingSlot >= 0) return;
        if (event.key === Qt.Key_Escape) { canceled(); event.accepted = true; }
        else if (event.key === Qt.Key_S && (event.modifiers & Qt.ControlModifier)) { requestSave(); event.accepted = true; }
        else if (tab === 0 && (event.modifiers & Qt.AltModifier) && (event.key === Qt.Key_Left || event.key === Qt.Key_Right)) {
            moveSlot(selectedSlot, (selectedSlot + (event.key === Qt.Key_Right ? 1 : actions.length - 1)) % actions.length); event.accepted = true;
        }
    }
    Rectangle {
        anchors.fill: parent; radius: Commons.Style.cornerRadius
        color: Commons.Color.menu.background
        border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.25)
        MouseArea { anchors.fill: parent; acceptedButtons: Qt.AllButtons; onClicked: panel.forceActiveFocus() }
    }
    Column {
        id: header
        x: Commons.Style.space(18); y: x; width: parent.width - x * 2; spacing: Commons.Style.space(10)
        EditorLabel { width: parent.width; text: panel.editingSlot >= 0 ? actionEditor.pageTitle : "Orb settings"; font.pixelSize: Commons.Style.space(20); font.weight: Font.DemiBold }
        EditorLabel {
            width: parent.width; wrapMode: Text.WordWrap; opacity: 0.65
            text: panel.editingSlot >= 0 ? (panel.editingSlot === panel.actions.length ? "Add a shortcut to your wheel" : "Slot " + (panel.editingSlot + 1) + " · " + panel.positions[panel.editingSlot])
                : panel.tab === 0 ? "Choose your shortcuts and put them where you want them."
                : panel.tab === 1 ? "Make the wheel feel at home on your desktop." : "Choose how you open Orb."
        }
        Row {
            id: tabRow
            visible: panel.editingSlot < 0; width: parent.width; spacing: Commons.Style.space(6)
            Repeater {
                model: ["Shortcuts", "Appearance", "Opening"]
                delegate: EditorButton {
                    required property int index
                    required property string modelData
                    objectName: "orb-tab-" + index
                    width: (header.width - parent.spacing * 2) / 3; text: modelData
                    selected: panel.tab === index; enabled: !panel.busy
                    onClicked: panel.selectTab(index)
                }
            }
        }
    }
    Flickable {
        id: body
        x: header.x; y: header.y + header.height + Commons.Style.space(14)
        width: header.width; height: Math.max(1, footer.y - y - Commons.Style.space(12))
        contentWidth: width; contentHeight: bodyColumn.height
        clip: true; boundsBehavior: Flickable.StopAtBounds
        WheelHandler {
            target: null
            enabled: !panel.busy && body.contentHeight > body.height
            acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
            onWheel: event => {
                var delta = event.pixelDelta.y || event.angleDelta.y / 120 * Commons.Style.space(40);
                body.contentY = Math.max(0, Math.min(body.contentHeight - body.height, body.contentY - delta));
                event.accepted = true;
            }
        }
        Controls.ScrollBar.vertical: Controls.ScrollBar {
            policy: Controls.ScrollBar.AsNeeded
            contentItem: Rectangle { implicitWidth: Commons.Style.space(4); radius: width / 2; color: Commons.Util.alpha(Commons.Color.menu.text, 0.45) }
        }
        Column {
            id: bodyColumn
            width: body.width; spacing: Commons.Style.space(10)
            Item {
                visible: panel.editingSlot < 0 && panel.tab === 0
                width: parent.width
                height: panel.wide ? Math.max(previewColumn.height, slotColumn.height) : previewColumn.height + slotColumn.height + Commons.Style.space(14)
                Column {
                    id: previewColumn
                    x: panel.wide ? 0 : (parent.width - width) / 2
                    width: Math.min(Commons.Style.space(260), parent.width); spacing: Commons.Style.space(10)
                    WheelPreview {
                        id: preview
                        width: parent.width; actions: panel.actions; selected: panel.selectedSlot; busy: panel.busy
                        iconSources: panel.actions.map(function(a) { return panel.appIcon(a); })
                        onPicked: index => panel.editSlot(index)
                        onMoved: (from, to) => panel.moveSlot(from, to)
                    }
                    EditorLabel { width: parent.width; horizontalAlignment: Text.AlignHCenter; text: preview.caption; wrapMode: Text.WordWrap }
                    EditorLabel { width: parent.width; horizontalAlignment: Text.AlignHCenter; text: "Drag to arrange · click to edit"; opacity: 0.65; font.pixelSize: Commons.Style.space(10) }
                }
                Column {
                    id: slotColumn
                    x: panel.wide ? previewColumn.width + Commons.Style.space(18) : 0
                    y: panel.wide ? 0 : previewColumn.height + Commons.Style.space(14)
                    width: parent.width - x; spacing: Commons.Style.space(7)
                    Item {
                        id: slotNavigation
                        width: parent.width; height: slotRows.height; focus: true; activeFocusOnTab: true
                        Keys.onPressed: event => {
                            if (event.modifiers & Qt.AltModifier) return;
                            if (event.key === Qt.Key_Up || event.key === Qt.Key_Down) {
                                panel.selectedSlot = (panel.selectedSlot + (event.key === Qt.Key_Down ? 1 : panel.actions.length - 1)) % panel.actions.length;
                                panel.reveal(slotRepeater.itemAt(panel.selectedSlot));
                            }
                            else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) panel.editSlot(panel.selectedSlot);
                            else if (event.key === Qt.Key_Delete) panel.removeSlot(panel.selectedSlot);
                            else return;
                            event.accepted = true;
                        }
                        Column {
                            id: slotRows
                            width: parent.width; spacing: Commons.Style.space(4)
                            Repeater {
                                id: slotRepeater
                                model: panel.actions
                                delegate: EditorButton {
                                    required property int index
                                    required property var modelData
                                    objectName: "orb-slot-" + index
                                    width: slotRows.width; height: Commons.Style.space(40)
                                    focusable: false; leftAlign: true; leftPadding: Commons.Style.space(40)
                                    text: (index + 1) + " · " + modelData.label
                                    tooltipText: panel.positions[index] || ""; selected: panel.selectedSlot === index; enabled: !panel.busy
                                    ActionIcon { x: Commons.Style.space(10); anchors.verticalCenter: parent.verticalCenter; width: Commons.Style.space(20); height: width; name: modelData.icon; appSource: panel.appIcon(modelData); selected: panel.selectedSlot === index }
                                    onClicked: { panel.selectedSlot = index; panel.editSlot(index); }
                                }
                            }
                        }
                    }
                    Row {
                        width: parent.width; spacing: Commons.Style.space(5)
                        EditorButton { text: "←"; width: Commons.Style.space(38); tooltipText: "Move anticlockwise · Alt+Left"; enabled: !panel.busy; onClicked: panel.moveSlot(panel.selectedSlot, (panel.selectedSlot + panel.actions.length - 1) % panel.actions.length) }
                        EditorButton { text: "→"; width: Commons.Style.space(38); tooltipText: "Move clockwise · Alt+Right"; enabled: !panel.busy; onClicked: panel.moveSlot(panel.selectedSlot, (panel.selectedSlot + 1) % panel.actions.length) }
                        EditorButton { text: "Remove"; enabled: !panel.busy && panel.actions.length > 6; onClicked: panel.removeSlot(panel.selectedSlot) }
                    }
                    EditorButton { objectName: "orb-add-slot"; width: parent.width; text: panel.actions.length < 8 ? "+ Add shortcut · " + panel.actions.length + " / 8" : "8 / 8 shortcuts"; enabled: !panel.busy && panel.actions.length < 8; onClicked: panel.addSlot() }
                    EditorLabel { width: parent.width; wrapMode: Text.WordWrap; text: "↑ ↓ select · Enter edits · Alt+← → moves"; opacity: 0.65; font.pixelSize: Commons.Style.space(10) }
                }
            }
            Column {
                visible: panel.editingSlot < 0 && panel.tab === 1
                width: parent.width; spacing: Commons.Style.space(14)
                EditorLabel { text: "Wheel size · " + Math.round(Commons.Style.space(panel.diameter)) + " px" }
                Item {
                    id: sizeControl
                    width: parent.width; height: Commons.Style.space(34); activeFocusOnTab: true
                    Keys.onLeftPressed: panel.diameter = Math.max(220, panel.diameter - 10)
                    Keys.onRightPressed: panel.diameter = Math.min(600, panel.diameter + 10)
                    Rectangle { anchors.fill: parent; radius: Commons.Style.cornerRadius; color: "transparent"; border.width: sizeControl.activeFocus ? 1 : 0; border.color: Commons.Color.accent }
                    PanelSlider {
                        anchors.fill: parent; enabled: !panel.busy
                        minimum: 220; maximum: 600; step: 10; integer: true; value: panel.diameter
                        trackColor: Commons.Util.alpha(Commons.Color.menu.text, 0.15); fillColor: Commons.Color.accent; knobColor: Commons.Color.accent
                        onMoved: value => { panel.diameter = Math.round(value / 10) * 10; sizeControl.forceActiveFocus(); }
                    }
                }
                EditorButton { text: "Opening animation · " + (panel.animation ? "On" : "Off"); selected: panel.animation; enabled: !panel.busy; onClicked: panel.animation = !panel.animation }
                EditorLabel { width: parent.width; text: "Follows your Omarchy theme and reduced-motion setting."; wrapMode: Text.WordWrap; opacity: 0.65 }
            }
            Column {
                visible: panel.editingSlot < 0 && panel.tab === 2
                width: parent.width; spacing: Commons.Style.space(12)
                EditorLabel { text: "Keyboard shortcut"; font.weight: Font.DemiBold }
                Row {
                    width: parent.width; spacing: Commons.Style.space(6)
                    Repeater {
                        model: [{ label: "Super", bit: 64 }, { label: "Ctrl", bit: 4 }, { label: "Alt", bit: 8 }, { label: "Shift", bit: 1 }]
                        delegate: EditorButton {
                            required property var modelData
                            objectName: "orb-modifier-" + modelData.label
                            text: modelData.label; selected: modelData.bit === 64 || !!((panel.shortcutCheck.mask || 0) & modelData.bit)
                            enabled: !panel.busy && modelData.bit !== 64; onClicked: panel.toggleModifier(modelData.bit)
                        }
                    }
                }
                EditorLabel { text: "Key · letter, number, F1–F12 or Space" }
                TextField {
                    id: openingKey
                    objectName: "orb-opening-key"
                    width: Math.min(parent.width, Commons.Style.space(180)); maximumLength: 5; enabled: !panel.busy
                    text: panel.shortcut.split("+").slice(-1)[0].trim(); placeholderText: "O"
                    onTextEdited: panel.changeKey(text)
                }
                EditorLabel { width: parent.width; wrapMode: Text.WordWrap; text: panel.shortcutCheck.error || panel.shortcutCheck.value; color: panel.shortcutCheck.error ? Commons.Color.urgent : Commons.Color.menu.text }
                EditorLabel { width: parent.width; wrapMode: Text.WordWrap; text: "Orb checks for shortcut conflicts before saving."; opacity: 0.65 }
                EditorButton { objectName: "orb-desktop-click"; text: "Right-click on empty desktop · " + (panel.desktopRightClick ? "On" : "Off"); selected: panel.desktopRightClick; enabled: !panel.busy; onClicked: panel.desktopRightClick = !panel.desktopRightClick }
                EditorLabel { width: parent.width; wrapMode: Text.WordWrap; text: "Applications keep their context menus. On the wallpaper, Orb replaces the right-double-click theme gesture."; opacity: 0.65 }
            }
            ActionEditor {
                id: actionEditor
                visible: panel.editingSlot >= 0; width: parent.width; height: visible ? implicitHeight : 0; busy: panel.busy
                onChosen: (action, origins) => panel.chooseAction(action, origins)
                onCanceled: panel.backToSlots()
            }
        }
    }
    Column {
        id: footer
        x: header.x; y: panel.height - height - Commons.Style.space(18); width: header.width; spacing: Commons.Style.space(8)
        EditorLabel { visible: panel.error !== ""; width: parent.width; text: panel.error; wrapMode: Text.WordWrap; color: Commons.Color.urgent }
        EditorButton { visible: panel.setupFailed; text: "Retry shortcut setup"; enabled: !panel.busy; onClicked: panel.retrySetup() }
        Row {
            visible: panel.editingSlot < 0; width: parent.width; spacing: Commons.Style.space(8)
            EditorButton { objectName: "orb-cancel"; width: (parent.width - parent.spacing) / 2; text: "Cancel"; enabled: !panel.busy; onClicked: panel.canceled() }
            EditorButton { objectName: "orb-save"; width: (parent.width - parent.spacing) / 2; text: panel.busy ? "Saving…" : "Save"; selected: true; enabled: !panel.busy && !panel.shortcutCheck.error; onClicked: panel.requestSave() }
        }
    }
    Connections {
        target: panel.Window.window
        enabled: panel.visible && panel.openingHeight === 0
        // Capture the rendered layout, after the columns have been polished.
        function onFrameSwapped() { panel.openingHeight = panel.implicitHeight; }
    }
    Connections {
        target: panel.Window.window
        function onActiveFocusItemChanged() {
            var item = panel.Window.window.activeFocusItem, ancestor = item;
            while (ancestor && ancestor !== body.contentItem) ancestor = ancestor.parent;
            if (!item || !ancestor || item === slotNavigation) return;
            panel.reveal(item);
        }
    }
}
