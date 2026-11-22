// A private Windows job owns each server child. Closing/killing the manager or
// this host closes the job, so an API cannot survive and lock its old port.
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Security.Cryptography;
using Microsoft.Win32.SafeHandles;
class ServerProcessHost {
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
 [DllImport("kernel32.dll")] static extern bool SetInformationJobObject(IntPtr job,int kind,IntPtr information,uint length);
 [DllImport("kernel32.dll")] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
 [StructLayout(LayoutKind.Sequential)] struct BasicLimits {public long ProcessTime,JobTime;public uint Flags;public UIntPtr MinimumWorkingSet,MaximumWorkingSet;public uint ActiveProcesses;public UIntPtr Affinity;public uint PriorityClass,SchedulingClass;}
 [StructLayout(LayoutKind.Sequential)] struct IoCounters {public ulong ReadOperations,WriteOperations,OtherOperations,ReadBytes,WriteBytes,OtherBytes;}
 [StructLayout(LayoutKind.Sequential)] struct ExtendedLimits {public BasicLimits Basic;public IoCounters Io;public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory;}
 static string Quote(string value){return "\""+value.Replace("\"","\\\"")+"\"";}
 static int Main(string[] args){
  IntPtr job=IntPtr.Zero;Process child=null;
  try{
   Console.InputEncoding=new UTF8Encoding(false);Console.OutputEncoding=new UTF8Encoding(false);
   if(args.Length==3&&args[0]=="--manager-birth"){
    using(Process manager=Process.GetProcessById(int.Parse(args[1]))){if(!String.Equals(manager.MainModule.FileName,System.IO.Path.GetFullPath(args[2]),StringComparison.OrdinalIgnoreCase))return 2;Console.Out.Write(manager.StartTime.ToUniversalTime().Ticks.ToString());return 0;}
   }
   if(args.Length==4&&args[0]=="--stop-manager"){
    using(Process manager=Process.GetProcessById(int.Parse(args[1]))){
     if(manager.StartTime.ToUniversalTime().Ticks!=long.Parse(args[2])||!String.Equals(manager.MainModule.FileName,System.IO.Path.GetFullPath(args[3]),StringComparison.OrdinalIgnoreCase))return 2;
     manager.Kill();manager.WaitForExit(5000);return 0;
    }
   }
   if(args.Length==1&&(args[0]=="--protect-settings"||args[0]=="--unprotect-settings")){
    byte[] entropy=Encoding.UTF8.GetBytes("Alpine Local Server settings v1");string input=Console.In.ReadToEnd();
    if(args[0]=="--protect-settings")Console.Out.Write(Convert.ToBase64String(ProtectedData.Protect(Encoding.UTF8.GetBytes(input),entropy,DataProtectionScope.CurrentUser)));
    else Console.Out.Write(Encoding.UTF8.GetString(ProtectedData.Unprotect(Convert.FromBase64String(input),entropy,DataProtectionScope.CurrentUser)));
    return 0;
   }
   if(args.Length!=3)throw new Exception("Invalid private process configuration.");
   using(Process parent=Process.GetProcessById(int.Parse(args[0]))){
    // Open the handle before starting the child. The handle cannot be confused
    // with a reused PID if the manager exits immediately after launch.
    IntPtr parentHandle=parent.Handle;if(parent.HasExited)return 0;
    job=CreateJobObject(IntPtr.Zero,null);if(job==IntPtr.Zero)throw new Exception("Windows job unavailable.");
    ExtendedLimits limits=new ExtendedLimits();limits.Basic.Flags=0x2000; // KILL_ON_JOB_CLOSE
    int size=Marshal.SizeOf(typeof(ExtendedLimits));IntPtr buffer=Marshal.AllocHGlobal(size);
    try{Marshal.StructureToPtr(limits,buffer,false);if(!SetInformationJobObject(job,9,buffer,(uint)size))throw new Exception("Windows job configuration failed.");}finally{Marshal.FreeHGlobal(buffer);}
    ProcessStartInfo start=new ProcessStartInfo(args[1],Quote(args[2]));start.UseShellExecute=false;start.CreateNoWindow=true;start.RedirectStandardOutput=true;start.RedirectStandardError=true;start.StandardOutputEncoding=Encoding.UTF8;start.StandardErrorEncoding=Encoding.UTF8;
    child=new Process();child.StartInfo=start;child.OutputDataReceived+=(s,e)=>{if(e.Data!=null)Console.Out.WriteLine(e.Data);};child.ErrorDataReceived+=(s,e)=>{if(e.Data!=null)Console.Error.WriteLine(e.Data);};
    child.Start();if(!AssignProcessToJobObject(job,child.Handle)){try{child.Kill();}catch{}throw new Exception("The server process could not be protected by Windows.");}
    child.BeginOutputReadLine();child.BeginErrorReadLine();
    using(EventWaitHandle parentExit=new EventWaitHandle(false,EventResetMode.ManualReset))using(EventWaitHandle childExit=new EventWaitHandle(false,EventResetMode.ManualReset)){
     parentExit.SafeWaitHandle=new SafeWaitHandle(parentHandle,false);childExit.SafeWaitHandle=new SafeWaitHandle(child.Handle,false);
     int ended=WaitHandle.WaitAny(new WaitHandle[]{parentExit,childExit});if(ended==0){CloseHandle(job);job=IntPtr.Zero;child.WaitForExit(5000);return 0;}
    }
    child.WaitForExit();return child.ExitCode;
   }
  }catch{Console.Error.WriteLine("The protected local server process could not start.");return 1;}
  finally{if(job!=IntPtr.Zero)CloseHandle(job);if(child!=null)child.Dispose();}
 }
}
