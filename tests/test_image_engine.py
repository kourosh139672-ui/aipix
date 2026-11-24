import unittest

from ImageEngine.app import ImageRequest, _extract_images


class ImageEngineTests(unittest.TestCase):
    def test_accepts_non_nature_subjects(self):
        request = ImageRequest(
            prompt="A red sports car parked beside a futuristic glass tower",
            size="1024x1024",
            style="photorealistic",
        )
        self.assertIn("sports car", request.prompt)

    def test_rejects_invalid_size(self):
        with self.assertRaises(ValueError):
            ImageRequest(prompt="A friendly robot", size="123x456")

    def test_extracts_openai_compatible_url(self):
        result = _extract_images({"data": [{"url": "https://images.example/image.png"}]})
        self.assertEqual(result, [{"url": "https://images.example/image.png"}])

    def test_extracts_base64(self):
        result = _extract_images({"data": [{"b64_json": "aGVsbG8="}]})
        self.assertEqual(result, [{"b64_json": "aGVsbG8="}])


if __name__ == "__main__":
    unittest.main()
