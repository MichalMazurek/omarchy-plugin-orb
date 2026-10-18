import QtQuick
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
    readonly property int selectionCount: submenuTitle ? menuRows.length : config.actions.length
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
        installedAgents = []; agentError = "";
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
        menuMoveGate.reset();
        selected = selected < 0 ? (delta > 0 ? 0 : selectionCount - 1) : (selected + delta + selectionCount) % selectionCount;
        if (submenuTitle) menuList.positionViewAtIndex(selected, ListView.Contain);
    }
    function back() {
        if (!submenuTitle) { dismiss(); return; }
        agents.running = false; submenuTitle = ""; agentMenu = false;
        selected = parentSelection; keyboardMode = true; moveGate.reset();
    }
    function activate(index) {
        if (!opened || index < 0 || index >= selectionCount) return;
        var action = submenuTitle ? menuRows[index] : config.actions[index];
        if (action.menu || action.children) {
            parentSelection = index; submenuTitle = action.label;
            agentMenu = action.menu === "agents";
            submenuRows = action.children || [];
            selected = -1; menuMoveGate.reset();
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
            menuX: submenu.x, menuY: submenu.y, menuWidth: submenu.width, menuHeight: submenu.height, agentError: agentError });
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
                else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) root.activate(root.selected);
                else if (event.key === Qt.Key_Right || event.key === Qt.Key_Down || (event.key === Qt.Key_Tab && !(event.modifiers & Qt.ShiftModifier))) root.select(1);
                else if (event.key === Qt.Key_Left || event.key === Qt.Key_Up || event.key === Qt.Key_Backtab || event.key === Qt.Key_Tab) root.select(-1);
                else if (event.key >= Qt.Key_1 && event.key <= Qt.Key_9 && event.key - Qt.Key_1 < root.selectionCount) {
                    root.keyboardMode = true; moveGate.reset(); menuMoveGate.reset(); root.selected = event.key - Qt.Key_1;
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
            visible: root.positioned && !root.submenuTitle
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
                onSurfaceChanged: requestPaint()
                onInkChanged: requestPaint()
                onAccentChanged: requestPaint()
                onSelectionChanged: requestPaint()
                onWidthChanged: requestPaint()
                onPaint: {
                    var c = getContext("2d"); c.reset();
                    var center = width / 2, outer = width * 0.48, inner = width * 0.18;
                    c.lineWidth = 1;
                    for (var i = 0; i < 6; i++) {
                        var start = (i * 60 - 120 + 1) * Math.PI / 180;
                        var end = (i * 60 - 60 - 1) * Math.PI / 180;
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
                model: root.config.actions
                delegate: Item {
                    required property int index
                    required property var modelData
                    readonly property real angle: (index * 60 - 90) * Math.PI / 180
                    readonly property bool chosen: root.selected === index
                    width: wheel.width * 0.28
                    height: wheel.width * 0.16
                    x: wheel.width/2 + Math.cos(angle) * wheel.width * 0.33 - width/2
                    y: wheel.height/2 + Math.sin(angle) * wheel.width * 0.33 - height/2
                    LineIcon {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 0; width: Math.max(22, wheel.width * 0.072); height: width
                        name: modelData.icon
                        ink: parent.chosen ? Commons.Color.accent : Commons.Color.menu.text
                    }
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: Math.max(29, wheel.width * 0.10)
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
                color: Commons.Color.menu.background
                border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.18)
                Column {
                    anchors.centerIn: parent; spacing: 8
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "ORB"; textFormat: Text.PlainText
                        font.family: Commons.Style.font.family
                        font.pixelSize: Math.max(13, wheel.width * 0.042); font.letterSpacing: 3
                        color: Commons.Color.menu.text
                    }
                }
            }
            PointerMoveGate { id: moveGate; referenceItem: wheel }
            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                acceptedButtons: Qt.AllButtons
                cursorShape: root.selected >= 0 && !root.keyboardMode ? Qt.PointingHandCursor : Qt.ArrowCursor
                onPositionChanged: mouse => {
                    if (!moveGate.moved(this, mouse)) return;
                    root.keyboardMode = false;
                    root.selected = Model.hit(mouse.x, mouse.y, width);
                }
                onExited: if (!root.keyboardMode) root.selected = -1
                onClicked: mouse => {
                    var i = Model.hit(mouse.x, mouse.y, width);
                    if (mouse.button === Qt.LeftButton && i >= 0) root.activate(i);
                    else root.dismiss();
                }
            }
            Rectangle {
                anchors.top: parent.bottom; anchors.topMargin: 8
                anchors.horizontalCenter: parent.horizontalCenter
                width: hint.implicitWidth + 24; height: 28; radius: 14
                color: Commons.Color.menu.background
                border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.16)
                Text {
                    id: hint; anchors.centerIn: parent
                    text: root.configError ? "Config error · using last valid actions" : "Select · click or Enter"
                    textFormat: Text.PlainText
                    font.family: Commons.Style.font.menuFamily; font.pixelSize: 11
                    color: root.configError ? Commons.Color.urgent : Commons.Util.alpha(Commons.Color.menu.text, 0.7)
                }
            }
        }
        Rectangle {
            id: submenu
            visible: root.opened && root.positioned && !!root.submenuTitle
            readonly property var reserved: panel.monitorData.reserved || [0,0,0,0]
            width: Math.min(Commons.Style.space(250), panel.width - reserved[0] - reserved[2] - 24)
            height: Math.min(74 + Math.max(1, root.menuRows.length) * 46, panel.height - reserved[1] - reserved[3] - 24)
            x: Math.max(reserved[0] + 12, Math.min(wheel.x + wheel.width/2 - width/2, panel.width - reserved[2] - width - 12))
            y: Math.max(reserved[1] + 12, Math.min(wheel.y + wheel.height/2 - height/2, panel.height - reserved[3] - height - 12))
            radius: Math.max(10, Commons.Style.cornerRadius)
            color: Commons.Color.menu.background
            border.width: 1
            border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.25)
            MouseArea { anchors.fill: parent; acceptedButtons: Qt.AllButtons; onClicked: {} }
            PointerMoveGate { id: menuMoveGate; referenceItem: submenu }
            Rectangle {
                x: 10; y: 10; width: 36; height: 36; radius: 8
                color: backMouse.containsMouse ? Commons.Util.alpha(Commons.Color.accent, 0.15) : "transparent"
                Text { anchors.centerIn: parent; text: "‹"; textFormat: Text.PlainText; font.pixelSize: 26; color: Commons.Color.menu.text }
                MouseArea { id: backMouse; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: root.back() }
            }
            Text {
                x: 54; y: 18; text: root.submenuTitle; textFormat: Text.PlainText
                color: Commons.Color.menu.text; font.family: Commons.Style.font.menuFamily; font.pixelSize: 15; font.weight: Font.DemiBold
            }
            Rectangle { x: 14; y: 55; width: parent.width - 28; height: 1; color: Commons.Util.alpha(Commons.Color.menu.text, 0.12) }
            ListView {
                id: menuList
                x: 8; y: 64; width: parent.width - 16; height: parent.height - 72
                clip: true; boundsBehavior: Flickable.StopAtBounds
                model: root.menuRows
                delegate: Rectangle {
                    required property int index
                    required property var modelData
                    width: menuList.width; height: 46; radius: 7
                    color: root.selected === index ? Commons.Util.alpha(Commons.Color.accent, 0.15) : "transparent"
                    border.width: root.selected === index && root.keyboardMode ? 1 : 0
                    border.color: Commons.Color.accent
                    LineIcon { x: 13; anchors.verticalCenter: parent.verticalCenter; width: 21; height: 21; name: modelData.icon; ink: root.selected === index ? Commons.Color.accent : Commons.Color.menu.text }
                    Text {
                        x: 46; anchors.verticalCenter: parent.verticalCenter; width: parent.width - 75
                        text: modelData.label; textFormat: Text.PlainText; elide: Text.ElideRight
                        font.family: Commons.Style.font.menuFamily; font.pixelSize: 13
                        color: root.selected === index ? Commons.Color.accent : Commons.Color.menu.text
                    }
                    Text { anchors.right: parent.right; anchors.rightMargin: 14; anchors.verticalCenter: parent.verticalCenter; text: "↗"; textFormat: Text.PlainText; color: Commons.Util.alpha(Commons.Color.menu.text, 0.5); font.pixelSize: 14 }
                    MouseArea {
                        anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor
                        onPositionChanged: mouse => { if (menuMoveGate.moved(this, mouse)) { root.keyboardMode = false; root.selected = index; } }
                        onClicked: root.activate(index)
                    }
                }
            }
            Text {
                visible: root.menuRows.length === 0
                x: 20; y: 78; width: parent.width - 40
                text: agents.running ? "Finding installed agents…" : root.agentError || "No supported agents installed"
                textFormat: Text.PlainText; wrapMode: Text.WordWrap
                color: Commons.Color.menu.text; font.family: Commons.Style.font.menuFamily; font.pixelSize: 12
            }
        }
    }
}
