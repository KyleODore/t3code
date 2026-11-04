import type { NativeStackHeaderItemMenu } from "@react-navigation/native-stack";

import { Toolbar } from "./Toolbar";

import type { AppBarMenu, AppBarMenuItem } from "./AppBar.types";

function nativeHeaderMenuItems(
  items: ReadonlyArray<AppBarMenuItem>,
): NativeStackHeaderItemMenu["menu"]["items"] {
  return items.map((item) =>
    "items" in item
      ? {
          type: "submenu" as const,
          label: item.title ?? "",
          icon: item.icon ? { type: "sfSymbol" as const, name: item.icon as never } : undefined,
          inline: item.inline,
          items: nativeHeaderMenuItems(item.items),
        }
      : {
          type: "action" as const,
          label: item.title,
          description: item.subtitle,
          icon: item.icon ? { type: "sfSymbol" as const, name: item.icon as never } : undefined,
          disabled: item.disabled,
          state: item.selected ? ("on" as const) : undefined,
          onPress: item.onPress,
        },
  );
}

/** `createNativeHeaderMenu` for native item factories, which take data rather than children. */
export function createNativeHeaderMenuItem(
  menu: AppBarMenu,
  identifier: string,
): NativeStackHeaderItemMenu {
  return {
    type: "menu",
    accessibilityLabel: menu.title,
    icon: {
      type: "sfSymbol",
      name: (typeof menu.icon === "string" ? menu.icon : menu.icon.ios) as never,
    },
    identifier,
    label: menu.title,
    menu: { items: nativeHeaderMenuItems(menu.items) },
    sharesBackground: true,
    variant: "plain",
  };
}

function renderMenuItems(items: ReadonlyArray<AppBarMenuItem>) {
  return items.map((item) =>
    "items" in item ? (
      <Toolbar.Menu key={item.id} title={item.title} icon={item.icon} inline={item.inline}>
        {renderMenuItems(item.items)}
      </Toolbar.Menu>
    ) : (
      <Toolbar.MenuAction
        key={item.id}
        icon={item.icon}
        subtitle={item.subtitle}
        disabled={item.disabled}
        isOn={item.selected}
        onPress={item.onPress}
      >
        {item.title}
      </Toolbar.MenuAction>
    ),
  );
}

export function createNativeHeaderMenu(menu: AppBarMenu) {
  return (
    <Toolbar.Menu
      key={menu.title}
      title={menu.title}
      accessibilityLabel={menu.title}
      icon={typeof menu.icon === "string" ? menu.icon : menu.icon.ios}
      separateBackground={menu.separateBackground ?? true}
    >
      {menu.status ? <Toolbar.Label>{menu.status}</Toolbar.Label> : null}
      {renderMenuItems(menu.items)}
    </Toolbar.Menu>
  );
}
