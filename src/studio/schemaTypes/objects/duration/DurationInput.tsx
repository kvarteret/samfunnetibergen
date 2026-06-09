import { ObjectInputMember, type ObjectInputProps } from "sanity";

type DurationValue = {
  _type?: "duration";
  start?: string;
  end?: string;
};

export function DurationInput(props: ObjectInputProps<DurationValue>) {
  const { members } = props;

  const startMember = members.find(
    (member) => member.kind === "field" && member.name === "start",
  );
  const endMember = members.find(
    (member) => member.kind === "field" && member.name === "end",
  );

  if (!startMember || !endMember) {
    console.error(
      `Missing "start" or "end" member in DurationInput: "${props.schemaType.name}"`,
    );
    return props.renderDefault(props);
  }

  const renderProps = {
    renderField: props.renderField,
    renderInput: props.renderInput,
    renderItem: props.renderItem,
    renderPreview: props.renderPreview,
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <ObjectInputMember member={startMember} {...renderProps} />
      <ObjectInputMember member={endMember} {...renderProps} />
    </div>
  );
}
