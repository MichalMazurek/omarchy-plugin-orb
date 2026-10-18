import QtQuick
import QtQuick.Effects
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import Quickshell.Wayland
import qs.Commons as Commons
import qs.Ui
import "Model.js" as Model

Item {
    id: root
    property string omarchyPath: ""
    property var shell: null
    property var manifest: null
    property bool opened: false
    property bool positioned: false
    property int selected: -1
    property bool keyboardMode: false
    property point pointer: Qt.point(0, 0)
    property var config: ({ actions: [], diameter: 240, animation: true })
    property string submenuTitle: ""
    property bool agentMenu: false
    property var submenuRows: []
    property var installedAgents: []
    property string agentError: ""
    property int parentSelection: -1
    readonly property var menuRows: agentMenu ? installedAgents : submenuRows
    property int menuPage: 0
    readonly property int pageCount: submenuTitle ? Math.max(1, Math.ceil(menuRows.length / 6)) : 1
    readonly property var wheelActions: submenuTitle ? menuRows.slice(menuPage * 6, menuPage * 6 + 6) : config.actions
    readonly property int selectionCount: wheelActions.length
    property string configError: ""
    property var pendingCommand: []
    property string lastAction: ""
    readonly property string pluginId: "io.github.tcballard.orb"
    readonly property string configPath: (Quickshell.env("XDG_CONFIG_HOME") || Quickshell.env("HOME") + "/.config") + "/omarchy/orb.json"

    function open(payloadJson) {
        // Payloads deliberately cannot change commands or configuration paths.
        try { JSON.parse(payloadJson || "{}"); } catch (error) {}
        launchDelay.stop(); pendingCommand = [];
        selected = -1; keyboardMode = false; positioned = false;
        submenuTitle = ""; agentMenu = false; parentSelection = -1;
        installedAgents = []; agentError = ""; menuPage = 0;
        moveGate.reset(); opened = true;
        cursor.running = false; cursor.running = true;
        Qt.callLater(function() { keys.forceActiveFocus(); });
    }
    function close() {
        opened = false; positioned = false; selected = -1;
        cursor.running = false; launchDelay.stop(); pendingCommand = [];
        agents.running = false; submenuTitle = ""; agentMenu = false;
    }
    function dismiss() {
        close();
        if (shell && typeof shell.hide === "function") shell.hide(pluginId);
    }
    function select(delta) {
        if (!selectionCount) return;
        keyboardMode = true; moveGate.reset();
        selected = selected < 0 ? (delta > 0 ? 0 : selectionCount - 1) : (selected + delta + selectionCount) % selectionCount;
    }
    function turnPage(delta) {
        if (pageCount < 2) return;
        menuPage = (menuPage + delta + pageCount) % pageCount;
        selected = -1; keyboardMode = true; moveGate.reset();
    }
    function back() {
        if (!submenuTitle) { dismiss(); return; }
        agents.running = false; submenuTitle = ""; agentMenu = false;
        selected = parentSelection; keyboardMode = true; moveGate.reset();
    }
    function activate(index) {
        if (!opened || index < 0 || index >= selectionCount) return;
        var action = wheelActions[index];
        if (action.menu || action.children) {
            parentSelection = index; submenuTitle = action.label;
            agentMenu = action.menu === "agents";
            submenuRows = action.children || [];
            selected = -1; menuPage = 0; moveGate.reset();
            if (agentMenu) { agentError = ""; installedAgents = []; agents.running = true; }
            return;
        }
        var command = action.command.slice(); lastAction = action.label;
        dismiss();
        // Let the compositor unmap the exclusive layer before a new UI or screenshot.
        pendingCommand = command; launchDelay.start();
    }
    function status() {
        return JSON.stringify({ opened: opened, positioned: positioned, selected: selected,
            keyboard: keyboardMode, x: wheel.x, y: wheel.y, diameter: wheel.width,
            screen: panel.targetScreen ? panel.targetScreen.name : "", error: configError,
            foreground: String(Commons.Color.menu.text), background: String(Commons.Color.menu.background),
            lastAction: lastAction, ready: panel.contentReady, revealed: panel.contentRevealed,
            opacity: wheel.opacity, visible: wheel.visible, windowWidth: panel.width, windowHeight: panel.height,
            scale: panel.devicePixelRatio, monitorScale: panel.targetMonitor ? panel.targetMonitor.scale : 0,
            submenu: submenuTitle, items: menuRows.map(function(a) { return a.label; }), loading: agents.running,
            menuX: wheel.x, menuY: wheel.y, menuWidth: wheel.width, menuHeight: wheel.height,
            page: menuPage, pages: pageCount, visibleItems: wheelActions.map(function(a) { return a.label; }), agentError: agentError });
    }
    FileView {
        id: defaults
        path: Qt.resolvedUrl("config.example.json")
        onLoaded: {
            root.config = Model.parse(text(), root.config).config;
            userConfig.reload();
        }
    }
    FileView {
        id: userConfig
        path: root.configPath
        watchChanges: true
        onFileChanged: reload()
        onLoaded: {
            var parsed = Model.parse(text(), root.config);
            root.config = parsed.config; root.configError = parsed.error;
        }
    }
    Process {
        id: cursor
        command: ["hyprctl", "-j", "cursorpos"]
        stdout: StdioCollector {
            onStreamFinished: {
                if (!root.opened) return;
                try {
                    var p = JSON.parse(text);
                    if (!isFinite(p.x) || !isFinite(p.y)) throw new Error("Invalid pointer");
                    root.pointer = Qt.point(p.x, p.y);
                } catch (error) {
                    var s = panel.targetScreen;
                    root.pointer = Qt.point(s ? s.x + s.width / 2 : 0, s ? s.y + s.height / 2 : 0);
                }
                root.positioned = true;
            }
        }
        onExited: {
            if (root.opened && !root.positioned) {
                var s = panel.targetScreen;
                root.pointer = Qt.point(s ? s.x + s.width / 2 : 0, s ? s.y + s.height / 2 : 0);
                root.positioned = true;
            }
        }
    }
    Timer {
        id: launchDelay
        interval: 120
        onTriggered: {
            var args = [Qt.resolvedUrl("scripts/launch").toString().replace(/^file:\/\//, ""), root.lastAction].concat(root.pendingCommand);
            root.pendingCommand = [];
            Quickshell.execDetached(args);
        }
    }
    Process {
        id: agents
        command: [Qt.resolvedUrl("scripts/agents").toString().replace(/^file:\/\//, "")]
        stdout: StdioCollector {
            onStreamFinished: {
                if (!root.opened || !root.agentMenu) return;
                try {
                    var rows = JSON.parse(text);
                    if (!Array.isArray(rows) || rows.length > 24) throw new Error("Invalid catalog");
                    var checked = rows.map(function(a) { return Model.action(a, 1); });
                    if (checked.some(function(a) { return !a; })) throw new Error("Invalid action");
                    root.installedAgents = checked;
                } catch (error) { root.agentError = "Could not read installed agents"; }
            }
        }
        onExited: (code, status) => {
            if (root.opened && root.agentMenu && code !== 0) root.agentError = "Could not read installed agents";
        }
    }
    IpcHandler {
        target: root.pluginId
        function status(): string { return root.status(); }
    }
    OverlayWindow {
        id: panel
        shown: root.opened
        shownKeyboardFocus: root.opened ? WlrKeyboardFocus.Exclusive : WlrKeyboardFocus.None
        WlrLayershell.namespace: "omarchy-plugin-orb"
        readonly property var monitorData: targetMonitor ? targetMonitor.lastIpcObject : ({})
        readonly property var placement: Model.placement(
            root.pointer.x - (monitorData.x || 0), root.pointer.y - (monitorData.y || 0),
            width, height, monitorData.reserved || [0,0,0,0], Commons.Style.space(root.config.diameter))

        MouseArea {
            anchors.fill: parent
            acceptedButtons: Qt.AllButtons
            onClicked: root.dismiss()
        }
        Item {
            id: keys
            anchors.fill: parent
            focus: root.opened
            Keys.onPressed: event => {
                if (event.key === Qt.Key_Escape || event.key === Qt.Key_Backspace || (root.submenuTitle && event.key === Qt.Key_Left)) root.back();
                else if (event.key === Qt.Key_PageDown) root.turnPage(1);
                else if (event.key === Qt.Key_PageUp) root.turnPage(-1);
                else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) root.activate(root.selected);
                else if (event.key === Qt.Key_Right || event.key === Qt.Key_Down || (event.key === Qt.Key_Tab && !(event.modifiers & Qt.ShiftModifier))) root.select(1);
                else if (event.key === Qt.Key_Left || event.key === Qt.Key_Up || event.key === Qt.Key_Backtab || event.key === Qt.Key_Tab) root.select(-1);
                else if (event.key >= Qt.Key_1 && event.key <= Qt.Key_9 && event.key - Qt.Key_1 < root.selectionCount) {
                    root.keyboardMode = true; moveGate.reset(); root.selected = event.key - Qt.Key_1;
                } else return;
                event.accepted = true;
            }
        }
        Item {
            id: wheel
            x: panel.placement.x
            y: panel.placement.y
            width: panel.placement.size
            height: width
            visible: root.positioned
            opacity: root.opened && root.positioned && panel.contentRevealed ? 1 : 0
            scale: opacity > 0 ? 1 : 0.92
            Behavior on opacity { NumberAnimation { duration: root.config.animation ? Commons.Style.duration(150) : 0 } }
            Behavior on scale { NumberAnimation { duration: root.config.animation ? Commons.Style.duration(190) : 0; easing.type: Easing.OutCubic } }

            Rectangle {
                anchors.centerIn: parent
                width: parent.width * 0.98; height: width; radius: width / 2
                color: Commons.Color.menu.background
                border.width: 1
                border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.25)
            }
            Canvas {
                id: ring
                anchors.fill: parent
                antialiasing: true
                property color surface: Commons.Color.menu.background
                property color ink: Commons.Color.menu.text
                property color accent: Commons.Color.accent
                property int selection: root.selected
                property int count: root.selectionCount
                onCountChanged: requestPaint()
                onSurfaceChanged: requestPaint()
                onInkChanged: requestPaint()
                onAccentChanged: requestPaint()
                onSelectionChanged: requestPaint()
                onWidthChanged: requestPaint()
                onPaint: {
                    var c = getContext("2d"); c.reset();
                    var center = width / 2, outer = width * 0.48, inner = width * 0.18;
                    c.lineWidth = 1;
                    var step = 360 / Math.max(1, count);
                    for (var i = 0; i < count; i++) {
                        var start = (i * step - 90 - step / 2 + 1) * Math.PI / 180;
                        var end = (i * step - 90 + step / 2 - 1) * Math.PI / 180;
                        c.beginPath(); c.arc(center,center,outer,start,end);
                        c.arc(center,center,inner,end,start,true); c.closePath();
                        c.fillStyle = surface; c.fill();
                        if (i === selection) { c.fillStyle = Commons.Util.alpha(accent, 0.17); c.fill(); }
                        c.strokeStyle = i === selection ? accent : Commons.Util.alpha(ink, 0.23); c.stroke();
                        if (i === selection) {
                            c.beginPath(); c.arc(center,center,outer-3,start+0.025,end-0.025);
                            c.strokeStyle = accent; c.lineWidth = 3; c.stroke(); c.lineWidth = 1;
                        }
                    }
                }
            }
            Repeater {
                model: root.wheelActions
                delegate: Item {
                    required property int index
                    required property var modelData
                    readonly property real angle: (index * 360 / root.selectionCount - 90) * Math.PI / 180
                    readonly property bool chosen: root.selected === index
                    width: wheel.width * 0.28
                    height: wheel.width * 0.16
                    x: wheel.width/2 + Math.cos(angle) * wheel.width * 0.33 - width/2
                    y: wheel.height/2 + Math.sin(angle) * wheel.width * 0.33 - height/2
                    ActionIcon {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 0; width: Math.max(22, wheel.width * 0.072); height: width
                        name: modelData.icon
                        ink: parent.chosen ? Commons.Color.accent : Commons.Color.menu.text
                    }
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: Math.max(29, wheel.width * 0.10)
                        width: parent.width; horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap; maximumLineCount: 2; elide: Text.ElideRight
                        text: modelData.label + (modelData.menu || modelData.children ? " ›" : ""); textFormat: Text.PlainText
                        color: parent.chosen ? Commons.Color.accent : Commons.Color.menu.text
                        font.family: Commons.Style.font.menuFamily
                        font.pixelSize: Math.max(11, wheel.width * 0.035)
                        font.weight: parent.chosen ? Font.DemiBold : Font.Normal
                    }
                }
            }
            Rectangle {
                anchors.centerIn: parent
                width: parent.width * 0.32; height: width; radius: width / 2
                color: root.submenuTitle && wheelMouse.atCentre ? Commons.Util.alpha(Commons.Color.accent, 0.15) : Commons.Color.menu.background
                border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.18)
                Image {
                    id: omarchyMark
                    anchors.centerIn: parent
                    width: parent.width * 0.42; height: width
                    source: Qt.resolvedUrl("assets/omarchy-logo.svg")
                    sourceSize.width: Math.ceil(width * 2)
                    sourceSize.height: Math.ceil(height * 2)
                    fillMode: Image.PreserveAspectFit
                    visible: false
                    layer.enabled: true
                }
                MultiEffect {
                    anchors.fill: omarchyMark
                    source: omarchyMark
                    visible: !root.submenuTitle
                    colorization: 1.0
                    colorizationColor: Commons.Color.menu.text
                }
                Column {
                    visible: !!root.submenuTitle
                    anchors.centerIn: parent; spacing: 0
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "‹"; textFormat: Text.PlainText
                        font.family: Commons.Style.font.family
                        font.pixelSize: 26
                        color: Commons.Color.menu.text
                    }
                    Text {
                        visible: !!root.submenuTitle
                        anchors.horizontalCenter: parent.horizontalCenter
                        width: wheel.width * 0.29
                        text: root.submenuTitle; textFormat: Text.PlainText
                        horizontalAlignment: Text.AlignHCenter; elide: Text.ElideRight
                        font.family: Commons.Style.font.menuFamily; font.pixelSize: 11
                        color: Commons.Color.menu.text
                    }
                }
            }
            PointerMoveGate { id: moveGate; referenceItem: wheel }
            MouseArea {
                id: wheelMouse
                readonly property bool atCentre: containsMouse && Math.hypot(mouseX - width/2, mouseY - height/2) < width * 0.18
                anchors.fill: parent
                hoverEnabled: true
                acceptedButtons: Qt.AllButtons
                cursorShape: (root.selected >= 0 && !root.keyboardMode) || (root.submenuTitle && atCentre) ? Qt.PointingHandCursor : Qt.ArrowCursor
                onPositionChanged: mouse => {
                    if (!moveGate.moved(this, mouse)) return;
                    root.keyboardMode = false;
                    root.selected = Model.hit(mouse.x, mouse.y, width, root.selectionCount);
                }
                onExited: if (!root.keyboardMode) root.selected = -1
                onClicked: mouse => {
                    var i = Model.hit(mouse.x, mouse.y, width, root.selectionCount);
                    if (mouse.button === Qt.LeftButton && i >= 0) root.activate(i);
                    else if (mouse.button === Qt.LeftButton && root.submenuTitle
                        && Math.hypot(mouse.x - width/2, mouse.y - height/2) < width * 0.18) root.back();
                    else root.dismiss();
                }
                onWheel: event => { root.turnPage(event.angleDelta.y < 0 ? 1 : -1); event.accepted = true; }
            }
            Rectangle {
                anchors.top: parent.bottom; anchors.topMargin: 8
                anchors.horizontalCenter: parent.horizontalCenter
                width: Math.min(wheel.width, hint.implicitWidth + (root.pageCount > 1 ? 72 : 24)); height: 28; radius: 14
                color: Commons.Color.menu.background
                border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.16)
                Text {
                    id: hint; anchors.centerIn: parent
                    width: parent.width - (root.pageCount > 1 ? 64 : 20)
                    horizontalAlignment: Text.AlignHCenter; elide: Text.ElideRight
                    text: root.configError ? "Config error · using last valid actions"
                        : root.submenuTitle && !root.selectionCount ? (agents.running ? "Finding installed agents…" : root.agentError || "No supported agents installed")
                        : root.pageCount > 1 ? "Page " + (root.menuPage + 1) + " / " + root.pageCount
                        : root.submenuTitle ? "Centre to go back · Enter to launch" : "Select · click or Enter"
                    textFormat: Text.PlainText
                    font.family: Commons.Style.font.menuFamily; font.pixelSize: 11
                    color: root.configError ? Commons.Color.urgent : Commons.Util.alpha(Commons.Color.menu.text, 0.7)
                }
                Repeater {
                    model: root.pageCount > 1 ? 2 : 0
                    delegate: Item {
                        required property int index
                        x: index === 0 ? 0 : parent.width - width
                        width: 32; height: parent.height
                        Text { anchors.centerIn: parent; text: index === 0 ? "‹" : "›"; font.pixelSize: 22; color: Commons.Color.menu.text }
                        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.turnPage(index === 0 ? -1 : 1) }
                    }
                }
            }
        }
    }
}
