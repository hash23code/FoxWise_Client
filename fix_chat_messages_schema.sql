-- ============================================================================
-- FIX CHAT MESSAGES TABLE - Add missing columns
-- ============================================================================
-- This adds the columns that the API expects but are missing from the table
-- ============================================================================

-- Add missing columns to fc_chat_messages if they don't exist
DO $$
BEGIN
    -- Add sender_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fc_chat_messages' AND column_name = 'sender_id'
    ) THEN
        -- If user_id exists, rename it to sender_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'fc_chat_messages' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE fc_chat_messages RENAME COLUMN user_id TO sender_id;
            RAISE NOTICE 'Renamed user_id to sender_id';
        ELSE
            ALTER TABLE fc_chat_messages ADD COLUMN sender_id VARCHAR(255) NOT NULL DEFAULT '';
            RAISE NOTICE 'Added sender_id column';
        END IF;
    END IF;

    -- Add message_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fc_chat_messages' AND column_name = 'message_type'
    ) THEN
        ALTER TABLE fc_chat_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
        RAISE NOTICE 'Added message_type column';
    END IF;

    -- Add is_deleted column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fc_chat_messages' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE fc_chat_messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_deleted column';
    END IF;

    -- Add voice_duration column if it doesn't exist (for future voice messages)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fc_chat_messages' AND column_name = 'voice_duration'
    ) THEN
        ALTER TABLE fc_chat_messages ADD COLUMN voice_duration INTEGER;
        RAISE NOTICE 'Added voice_duration column';
    END IF;

    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fc_chat_messages' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE fc_chat_messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added deleted_at column';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fc_chat_messages' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE fc_chat_messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

    RAISE NOTICE '✅ fc_chat_messages table schema updated successfully!';
END $$;

-- Create index for sender_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_sender'
    ) THEN
        CREATE INDEX idx_messages_sender ON fc_chat_messages(sender_id);
        RAISE NOTICE 'Created index on sender_id';
    END IF;
END $$;
