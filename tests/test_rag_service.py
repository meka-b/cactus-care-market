import pytest
from backend.rag_service import chunk_text

def test_chunk_text_empty():
    """Test with empty text, should return empty list."""
    assert chunk_text("") == []

def test_chunk_text_small():
    """Test with small text (>50 chars, <chunk_chars) which shouldn't be split."""
    text = "This is a small text but it is definitely longer than fifty characters in total length so it gets yielded."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0] == text

def test_chunk_text_large_and_overlap():
    """Test with large text to verify splitting and overlap behavior."""
    # Generate text with multiple words
    words = ["word" + str(i) for i in range(100)]
    text = " ".join(words)

    # We will use small chunk_chars and overlap_chars
    chunks = chunk_text(text, chunk_chars=150, overlap_chars=30)

    assert len(chunks) > 1

    # Check overlap (the last few words of chunk 0 should be at the start of chunk 1)
    chunk0_words = chunks[0].split()
    chunk1_words = chunks[1].split()

    # Overlap logic ensures some words from end of chunk 0 are at start of chunk 1
    # Check that at least the last word of chunk 0 is in chunk 1
    # Actually, overlap_chars=30 means roughly 30 chars are overlapping.
    # We just verify that the intersection of words at boundary is not empty.
    overlap_word = chunk0_words[-1]
    assert overlap_word in chunk1_words[:10]

def test_chunk_text_markdown_context():
    """Test that markdown headers are prepended as context."""
    text = (
        "# Header 1\n"
        "Some text under header 1.\n"
        "## Header 2\n"
        "Some text under header 2.\n"
        "### Header 3\n"
        "Here is a fairly long text that will eventually exceed the chunk size limit "
        "and force a new chunk to be created, which should include the context of the headers."
    )

    # Use chunk_chars small enough to split the text
    chunks = chunk_text(text, source_type="markdown", chunk_chars=100)

    assert len(chunks) > 1

    # The chunks should have context prefixes
    has_full_context = False
    for chunk in chunks:
        if "[Bağlam: Header 1 > Header 2 > Header 3]" in chunk:
            has_full_context = True

    assert has_full_context

def test_chunk_text_non_markdown_context():
    """Test that headers are ignored when source_type is not markdown."""
    text = (
        "# Header 1\n"
        "Some text under header 1.\n"
        "## Header 2\n"
        "Some text under header 2.\n"
        "### Header 3\n"
        "Here is a fairly long text that will eventually exceed the chunk size limit "
        "and force a new chunk to be created, which should include the context of the headers."
    )

    chunks = chunk_text(text, source_type="text", chunk_chars=100)

    assert len(chunks) > 1

    # No chunk should have a markdown context prefix
    for chunk in chunks:
        assert "[Bağlam:" not in chunk

def test_chunk_text_paragraph_spacing():
    """Test that paragraph spacing is preserved."""
    text = (
        "This is paragraph one.\n"
        "\n"
        "This is paragraph two."
    )

    # Needs to be > 50 chars to be returned
    text = "This is paragraph one. It has to be reasonably long to pass the fifty character limit.\n\nThis is paragraph two. It also has to be long enough to be meaningful."

    chunks = chunk_text(text, chunk_chars=500)

    assert len(chunks) == 1
    assert "\n\n" in chunks[0]
