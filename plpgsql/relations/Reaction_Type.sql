create table public."REACTION_TYPE" (
  reaction_type_id smallserial not null,
  emoji text not null,
  label text not null,
  description text null,
  constraint REACTION_TYPE_pkey primary key (reaction_type_id),
  constraint REACTION_TYPE_emoji_key unique (emoji),
  constraint REACTION_TYPE_label_key unique (label),
  constraint REACTION_TYPE_label_check check (
    (
      label = any (
        array[
          'like'::text,
          'love'::text,
          'dua'::text,
          'insightful'::text,
          'thankful'::text,
          'chuckle'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

INSERT INTO "public"."REACTION_TYPE" ("reaction_type_id", "emoji", "label", "description") VALUES ('1', '👍', 'like', 'Agreement'), ('2', '❤️', 'love', 'Emotional Connection
'), ('3', '🤲', 'dua', 'wishing blessings'), ('4', '💡', 'insightful', 'Finding the post thoughtful'), ('5', '🌙', 'thankful', 'barakah'), ('6', '🤭', 'chuckle', 'A gentle laugh at humorous content');