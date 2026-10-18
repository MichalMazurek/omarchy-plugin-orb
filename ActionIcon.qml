import QtQuick
import qs.Commons as Commons

Item {
    id: icon
    property string name: "browser"
    property url appSource: ""
    property color ink: Commons.Color.menu.text
    property bool selected: false
    readonly property bool branded: name === "codex" || name === "claude" || name === "grok"
    readonly property color surface: Commons.Color.menu.background
    function linear(channel) {
        return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    }
    readonly property bool lightSurface: 0.2126 * linear(surface.r) + 0.7152 * linear(surface.g) + 0.0722 * linear(surface.b) > 0.179

    Image {
        id: mark
        anchors.fill: parent
        visible: (icon.branded || icon.appSource.toString() !== "") && status === Image.Ready
        source: icon.appSource.toString() !== "" ? icon.appSource : icon.branded ? Qt.resolvedUrl("assets/agents/" + icon.name
            + (icon.lightSurface && icon.name !== "claude" ? "-light" : "") + ".svg") : ""
        sourceSize.width: Math.ceil(width * 2)
        sourceSize.height: Math.ceil(height * 2)
        fillMode: Image.PreserveAspectFit
    }
    LineIcon {
        anchors.fill: parent
        visible: !mark.visible
        name: icon.branded ? "agents" : icon.name
        ink: icon.selected ? "#ffffff" : icon.ink
    }
}
