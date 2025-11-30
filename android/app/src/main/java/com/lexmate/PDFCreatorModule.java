package com.lexmate;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.pdf.PdfDocument;
import android.os.Environment;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

public class PDFCreatorModule extends ReactContextBaseJavaModule {

    public PDFCreatorModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "PDFCreator";
    }

    @ReactMethod
    public void createPDF(ReadableArray imagePaths, String outputFileName, Promise promise) {
        try {
            PdfDocument document = new PdfDocument();

            for (int i = 0; i < imagePaths.size(); i++) {
                String imagePath = imagePaths.getString(i);

                // Remove file:// prefix if present
                if (imagePath.startsWith("file://")) {
                    imagePath = imagePath.substring(7);
                }

                // Load the image
                Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
                if (bitmap == null) {
                    promise.reject("ERROR", "Failed to load image: " + imagePath);
                    return;
                }

                // Create a page with the image dimensions
                PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(
                        bitmap.getWidth(),
                        bitmap.getHeight(),
                        i + 1).create();

                PdfDocument.Page page = document.startPage(pageInfo);

                // Draw the bitmap on the page
                page.getCanvas().drawBitmap(bitmap, 0, 0, null);

                document.finishPage(page);
                bitmap.recycle();
            }

            // Save the PDF
            File documentsDir = getReactApplicationContext().getFilesDir();
            File pdfFile = new File(documentsDir, outputFileName);

            FileOutputStream fos = new FileOutputStream(pdfFile);
            document.writeTo(fos);
            document.close();
            fos.close();

            promise.resolve(pdfFile.getAbsolutePath());

        } catch (IOException e) {
            promise.reject("ERROR", "Failed to create PDF: " + e.getMessage());
        }
    }
}
