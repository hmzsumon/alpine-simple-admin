// Winspool RAW follows Microsoft's StartDoc/StartPage/Write/EndPage/EndDoc sequence.
using System;
using System.IO;
using System.ComponentModel;
using System.Runtime.InteropServices;
internal static class RawPrint {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] private class DocInfo { public string pDocName; public string pOutputFile; public string pDataType; }
 [DllImport("winspool.drv", EntryPoint="OpenPrinterW", SetLastError=true, CharSet=CharSet.Unicode)] private static extern bool OpenPrinter(string name,out IntPtr handle,IntPtr defaults);
 [DllImport("winspool.drv", SetLastError=true)] private static extern bool ClosePrinter(IntPtr handle);
 [DllImport("winspool.drv", EntryPoint="StartDocPrinterW", SetLastError=true, CharSet=CharSet.Unicode)] private static extern int StartDocPrinter(IntPtr handle,int level,[In] DocInfo info);
 [DllImport("winspool.drv", SetLastError=true)] private static extern bool StartPagePrinter(IntPtr handle);
 [DllImport("winspool.drv", SetLastError=true)] private static extern bool WritePrinter(IntPtr handle,IntPtr bytes,int count,out int written);
 [DllImport("winspool.drv", SetLastError=true)] private static extern bool EndPagePrinter(IntPtr handle);
 [DllImport("winspool.drv", SetLastError=true)] private static extern bool EndDocPrinter(IntPtr handle);
 [DllImport("winspool.drv", SetLastError=true)] private static extern bool AbortPrinter(IntPtr handle);
 private static void Check(bool ok,string operation) { if(!ok)throw new Win32Exception(Marshal.GetLastWin32Error(),operation+" failed. Check the printer before Reprint."); }
 private static byte[] Payload(string file) { byte[] bytes=File.ReadAllBytes(file); if(bytes.Length<8||bytes.Length>2000000||bytes[0]!=27||bytes[1]!=64)throw new Exception("Invalid Alpine receipt data.");return bytes; }
 private static int Main(string[] args) {
  try {
   if(args.Length==2&&args[0]=="--validate"){Console.WriteLine("{\"valid\":true,\"bytes\":"+Payload(args[1]).Length+"}");return 0;}
   if(args.Length!=6||args[0]!="--printer"||args[2]!="--file"||args[4]!="--name"||args[1].Length==0||args[1].Length>256)throw new Exception("Invalid Alpine printer arguments.");
   byte[] bytes=Payload(args[3]);IntPtr handle=IntPtr.Zero;bool started=false;GCHandle pinned=default(GCHandle);
   try {
    Check(OpenPrinter(args[1],out handle,IntPtr.Zero),"OpenPrinter");
    DocInfo doc=new DocInfo();doc.pDocName=args[5];doc.pDataType="RAW";int job=StartDocPrinter(handle,1,doc);if(job==0)Check(false,"StartDocPrinter");started=true;
    Check(StartPagePrinter(handle),"StartPagePrinter");pinned=GCHandle.Alloc(bytes,GCHandleType.Pinned);int offset=0;
    while(offset<bytes.Length){int written;Check(WritePrinter(handle,IntPtr.Add(pinned.AddrOfPinnedObject(),offset),bytes.Length-offset,out written),"WritePrinter");if(written<=0||written>bytes.Length-offset)throw new Exception("Incomplete receipt write. Check the paper before Reprint.");offset+=written;}
    Check(EndPagePrinter(handle),"EndPagePrinter");Check(EndDocPrinter(handle),"EndDocPrinter");started=false;
    Console.WriteLine("{\"jobId\":"+job+",\"bytes\":"+offset+"}");return 0;
   }finally{if(started)AbortPrinter(handle);if(pinned.IsAllocated)pinned.Free();if(handle!=IntPtr.Zero)ClosePrinter(handle);}
  }catch(Exception error){Console.Error.WriteLine(error.Message);return 1;}
 }
}
