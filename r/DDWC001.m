DDWC001 ; VEN/SMH - A strange name for an unknown routine;2013-10-25  1:38 AM
 ;
DD(RESULTS,ARGS) ; Get fileman field value, handles fileman/dd/{fields}
 ; Supported fields format:
 ; -  file,field; file,field; etc...
 ; -  field can be field1:field2
 N RTN  ; Return array internally
 I $$UNKARGS^VPRJRUT(.ARGS,"fields") Q  ; Is any of these not passed?
 N DDWI F DDWI=1:1:$L(ARGS("fields"),";") D
 . N PAIR S PAIR=$P(ARGS("fields"),";",DDWI)
 . N FILE S FILE=+$P(PAIR,",")
 . N FIELD S FIELD=$P(PAIR,",",2)
 . IF $L(FIELD,":")>1 DO  QUIT
 . . N START S START=+$P(FIELD,":") ; from JS
 . . N END S END=+$P(FIELD,":",2) ; from JS
 . . I START>END N T S T=END,END=START,START=T K T ; swap START and END
 . . I $D(^DD(FILE,START)) D getFieldAttr^DDWC001(.RTN,FILE,START)
 . . N DDWCI S DDWCI=START
 . . F  S DDWCI=$O(^DD(FILE,DDWCI)) Q:(DDWCI>END)  Q:'DDWCI  D getFieldAttr^DDWC001(.RTN,FILE,DDWCI)
 . ELSE  DO
 . . S FIELD=+FIELD ;from JS
 . . I '$D(^DD(FILE,FIELD)) D SETERROR^VPRJRUT(404,"File or field not found") QUIT
 . . D getFieldAttr^DDWC001(.RTN,FILE,FIELD)
 ;
 ;
 D ENCODE^VPRJSON($NA(RTN),$NA(RESULTS))
 QUIT
 ;
getFieldAttr(return,filenumber,fieldnumber) ;return field level attributes for a file
 ;public;procedure;silent,clean;not sac
 ;
 ; input:
 ; filenumber = ien of file to inspect
 ; output:
 ; .return = output array, passed by refernce
 ;
 n attrList d FIELDLST^DID($name(attrList))
 n attrs s attrs=""
 n name s name=""
 ;
 ;TODO: simplify this.
 f  d  q:name=""
 . s name=$o(attrList(name))
 . q:name=""
 . s attrs=attrs_";"_name
 s attrs=$e(attrs,2,$l(attrs))
 ;
 n fieldAttr d FIELD^DID(filenumber,fieldnumber,"",attrs,$name(fieldAttr))
 ;
 ; is our field a multiple?
 if fieldAttr("MULTIPLE-VALUED") do  quit
 . n mreturn  ; multiple return
 . n file s file=+fieldAttr("SPECIFIER") ; sub-file number
 . n ddwci s ddwci=0 f  s ddwci=$o(^DD(file,ddwci)) q:'ddwci  d getFieldAttr(.mreturn,file,ddwci)
 . n cnt s cnt=0
 . n i s i="" f  s i=$o(mreturn(i)) q:i=""  d
 . . s cnt=cnt+1
 . . i $e(filenumber)="." s filenumber=0_filenumber ; to play naaice with Javascript
 . . i $e(fieldnumber)="." s fieldnumber=0_fieldnumber ; ditto
 . . m return(filenumber_","_fieldnumber,cnt,i)=mreturn(i)
 ;
 ; loop and put our data in output array.
 ;
 i $e(filenumber)="." s filenumber=0_filenumber ; to play naaice with Javascript
 i $e(fieldnumber)="." s fieldnumber=0_fieldnumber ; ditto
 ;
 n attrName s attrName=""
 for  set attrName=$o(fieldAttr(attrName)) q:attrName=""  do
 . ;
 . ; Multiples... (DESCRIPTION and TECHNICAL DESCRIPTION) dd elements.
 . if fieldAttr(attrName)=$name(fieldAttr(attrName)) d
 . . i $e(filenumber)="." s filenumber=0_filenumber ; to play naaice with Javascript
 . . i $e(fieldnumber)="." s fieldnumber=0_fieldnumber ; ditto
 . . k return(filenumber_","_fieldnumber,attrName) ; remove top level node for JSON formatter
 . . n i f i=0:0 s i=$o(fieldAttr(attrName,i)) q:'i  s return(filenumber_","_fieldnumber,attrName,i)=fieldAttr(attrName,i)
 . ;
 . ; Singles
 . else  set return(filenumber_","_fieldnumber,attrName)=fieldAttr(attrName)
 ; 
 ;
 quit  ;end of getFieldAttr
 ;
 S RESULTS=$$GET1^DIQ(FILE,IENS,FIELD,,$NA(^TMP($J))) ; double trouble.
 I $D(^TMP("DIERR",$J)) D SETERROR^VPRJRUT(404,"File or field not found") QUIT
 ; if results is a regular field, that's the value we will get.
 ; if results is a WP field, RESULTS becomes the global ^TMP($J).
 I $D(^TMP($J)) D ADDCRLF^VPRJRUT(.RESULTS) ; crlf the result
 QUIT
 ;
VALS(ARGS,BODY,RESULT) ; POST - Validate a set of fields as a web service.
 N DDJSON M DDJSON=BODY
 ;
 ;^KBANFDA("V",7)="DDPFDA(2,1,""dd"")=.01"
 ;^KBANFDA("V",8)="DDPFDA(2,1,""dd"",""\s"")="""""
 ;^KBANFDA("V",9)="DDPFDA(2,1,""ien"")=""+1,"""
 ;^KBANFDA("V",10)="DDPFDA(2,1,""value"")=""abc"""
 ;
 ; TODO: DDPERR gives you an error now when there isn't one.
 N DDPFDA,DDPERR
 D DECODE^VPRJSON($NA(DDJSON),$NA(DDPFDA),$NA(DDPERR))
 N DDFFDA
 N FILE S FILE="" F  S FILE=$O(DDPFDA(FILE)) Q:'FILE  D
 . N J F J=0:0 S J=$O(DDPFDA(FILE,J)) Q:'J  D
 .. N IENS S IENS=DDPFDA(FILE,J,"ien")
 .. N FIELD S FIELD=DDPFDA(FILE,J,"dd")
 .. N VALUE S VALUE=DDPFDA(FILE,J,"value")
 .. ;
 .. ; DDFFDA(2,"+1,",.01)="abc"
 .. S DDFFDA(+FILE,IENS,+FIELD)=VALUE
 ;N PARSED ; Parsed array which stores each line on a separate node.
 ;D PARSE10^VPRJRUT(.BODY,.PARSED) ; Parser
 ;N DDWFDA M DDWFDA=PARSED
 N DDFOUT,DDFERR
 D VALS^DIE("",$NA(DDFFDA),$NA(DDFOUT),$NA(DDFERR))
 ;
 ; In case of error, construct error array
 ; Make sure the numbers are javascript friendly!!!
 IF $D(DIERR) K DDFOUT N I F I=0:0 S I=$O(DDFERR("DIERR",I)) Q:'I  D
 . N FILE,FIELD
 . S FILE=DDFERR("DIERR",I,"PARAM","FILE")
 . S FIELD=DDFERR("DIERR",I,"PARAM","FIELD")
 . N ERRNO
 . S ERRNO=DDFERR("DIERR",I)
 . N TEXT S TEXT=""
 . N J F J=0:0 S J=$O(DDFERR("DIERR",I,"TEXT",J)) Q:'J  S TEXT=TEXT_DDFERR("DIERR",I,"TEXT",J)_" "
 . S $E(TEXT,$L(TEXT))=""
 . S RESULT("errors",I,$$JSN(FILE)_","_$$JSN(FIELD))=ERRNO_U_TEXT
 ;
 ELSE  DO  ; send back the FDA...
 . N V S V=$NA(DDFOUT)
 . N CNT S CNT=1
 . F  S V=$Q(@V) Q:'$L(V)  S RESULT("fda",CNT,V)=@V,CNT=CNT+1
 ;
 ZSHOW "V":^KBANFDA
 ; TODO: DDERR - deal with this.
 N JSON,DDERR
 D ENCODE^VPRJSON($NA(RESULT),$NA(JSON),$NA(DDERR))
 K RESULT
 M RESULT=JSON
 ;M ^TMP($J)=^KBANFDA("V")
 ;S RESULT=$NA(^TMP($J))
 ;I $D(^TMP($J)) D ADDCRLF^VPRJRUT(.RESULT) ; crlf the result
 ;
 QUIT ""
JSN(N) ; Javascript number
 I $E(N)="." Q 0_N
 Q N
 ;
 ; ^KBANFDA("V",4)="DDFERR(""DIERR"")=""1^1"""
 ; ^KBANFDA("V",5)="DDFERR(""DIERR"",1)=701"
 ; ^KBANFDA("V",6)="DDFERR(""DIERR"",1,""PARAM"",0)=4"
 ; ^KBANFDA("V",7)="DDFERR(""DIERR"",1,""PARAM"",3)=""asdf"""
 ; ^KBANFDA("V",8)="DDFERR(""DIERR"",1,""PARAM"",""FIELD"")=.01"
 ; ^KBANFDA("V",9)="DDFERR(""DIERR"",1,""PARAM"",""FILE"")=2"
 ; ^KBANFDA("V",10)="DDFERR(""DIERR"",1,""PARAM"",""IENS"")=""+1,"""
 ; ^KBANFDA("V",11)="DDFERR(""DIERR"",1,""TEXT"",1)=""The value 'asdf' for field NAME in file PATIENT is not valid."""
 ; ^KBANFDA("V",12)="DDFERR(""DIERR"",""E"",701,1)="""""
TEST
 N F
 S F("fields")=".85,.01:999"
 N KBANR
 D DD(.KBANR,.F)
 N KBANJ
 D DECODE^VPRJSON($NA(KBANR),$NA(KBANJ)) ; there is a bug here!!!! need to fix tomorrow
 ;ZWRITE KBANR
 ;ZWRITE KBANJ
 D ASSERT($D(KBANJ("0.85,0.01")))
 D ASSERT($D(KBANJ("0.85,0.06")))
 QUIT
 ;
TEST2
 ;
 S JSON(1)="{""0.85"":[{""dd"":""0.01"",""ien"":""+1,"",""value"":""""},{""dd"":""0.02"",""ien"":""+1,"",""value"":""""},{""dd"":""0.03"",""ien"":""+1,"",""value"":""""},{""dd"":""0.04"",""ien"":""+1,"",""value"":""""},{""dd"":""0.05"",""ien"":""+1,"",""value"":""""},{""dd"":""0.06"",""ien"":""+1,"",""value"":""""},{""dd"":""0.07"",""ien"":""+1,"",""value"":""""},{""dd"":""0.08"",""ien"":""+1,"",""value"":""""},{""dd"":""0.09"",""ien"":""+1,"",""value"":""777777""},{""dd"":""10.1"",""ien"":""+1,"",""value"":""""},{""dd"":""10.2"",""ien"":""+1,"",""value"":""""},{""dd"":""10.21"",""ien"":""+1,"",""value"":""""},{""dd"":""10.22"",""ien"":""+1,"",""value"":""""},{""dd"":""10.3"",""ien"":""+1,"",""value"":""""},{""dd"":""10.4"",""ien"":""+1,"",""value"":""""},{""dd"":""10.5"",""ien"":""+1,"",""value"":""""},{""dd"":""20.2"",""ien"":""+1,"",""value"":""THIS IS NOT STANDARD MUMPS CODE""}]}"
 S %=$$VALS(,.JSON,.RES)
 ZWRITE RES
 QUIT
 ;
ASSERT(CONDITION)
 I 'CONDITION S $EC=",U-ASSERTION-FAILED,"
 QUIT
