import { icons } from "@sanity/icons"
import { Button, Card, Flex, Stack, Text } from "@sanity/ui"
import { useFormValue } from "sanity"
import { IntentLink } from "sanity/router"

export function FestivalDayShortcutInput() {
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "")

  return (
    <Card border padding={3} radius={2} tone="primary">
      <Flex align="center" gap={3} justify="space-between" wrap="wrap">
        <Stack space={2}>
          <Text weight="semibold">Festivaldager</Text>
          <Text muted size={1}>
            Opprett en ny dag som allerede er koblet til denne festivalen.
          </Text>
        </Stack>
        <Button
          as={IntentLink}
          disabled={!id}
          icon={icons.add}
          intent="create"
          params={[
            {
              mode: "structure",
              template: "festival-day",
              type: "arrangement",
            },
            { parentId: id },
          ]}
          text="Legg til festivaldag"
          tone="primary"
        />
      </Flex>
    </Card>
  )
}
