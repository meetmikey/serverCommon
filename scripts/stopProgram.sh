
if [ -z $1 ];
	then
		echo "No program specified.  usage: stopProgram.sh <program name (e.g. 'mikeyAPI')>"
		exit 1
fi

MY_PID=$$
PROG_NAME=$1
FULL_PROG_NAME=$PROG_NAME.js
MAX_WAIT_TIME_SECONDS=5
WORKERS_DONE_STRING="All workers done"

if [ "$2" == "now" ];
	then
		echo "Stopping now."
		forever stop $FULL_PROG_NAME
		exit 0
fi

LOG_DIR=/var/log/mikey/$PROG_NAME
LOG_FILE=out.log

#TEMP DEBUG
#LOG_DIR=/home/jdurack/logs
#LOG_FILE=mikeyAPIOut.txt

PROG_PID=`ps aux | grep $FULL_PROG_NAME | grep node | grep -v monitor | awk -F ' ' '{print $2}'`

if [ -z $PROG_PID ];
	then
		echo "no pid found"
		exit 1
fi

checkForWorkersDone() {
	tail -fn0 $LOG_DIR/$LOG_FILE --pid=$MY_PID | while read line; do
	  echo "$line" | grep "$WORKERS_DONE_STRING"
	  if [ $? = 0 ]
	  then
	    echo "Workers are done."
			forever stop $FULL_PROG_NAME
			kill -9 $MY_PID
			exit 0
	  fi
	done
}

eval "checkForWorkersDone &"

sleep .5
eval "kill -s SIGUSR2 $PROG_PID"

sleep $MAX_WAIT_TIME_SECONDS
forever stop $FULL_PROG_NAME
exit 0