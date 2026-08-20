import uuid
import re
from django.conf import settings
from django.db import models
from django.utils import timezone
from pgvector.django import VectorField


class InstitutionRole(models.TextChoices):
    SUPERADMIN = "SUPERADMIN", "Institution Superadmin"
    DIRECTOR_CAREER_SERVICES = "DIRECTOR_CAREER_SERVICES", "Director of Career Services"
    DEAN = "DEAN", "Dean of Faculty / School"
    HOD = "HOD", "Head of Department (HOD)"
    COUNSELLOR = "COUNSELLOR", "Faculty Career Counsellor & Evaluator"


class InstitutionType(models.TextChoices):
    UNIVERSITY = "UNIVERSITY", "University"
    POLYTECHNIC = "POLYTECHNIC", "Polytechnic"
    COLLEGE_OF_EDUCATION = "COLLEGE_OF_EDUCATION", "College of Education"
    MONOTECHNIC = "MONOTECHNIC", "Monotechnic"


class OwnershipType(models.TextChoices):
    FEDERAL = "FEDERAL", "Federal Government"
    STATE = "STATE", "State Government"
    PRIVATE = "PRIVATE", "Private"


class RegulatorType(models.TextChoices):
    NUC = "NUC", "National Universities Commission (NUC)"
    NBTE = "NBTE", "National Board for Technical Education (NBTE)"
    NCCE = "NCCE", "National Commission for Colleges of Education (NCCE)"


class TierTwoTerm(models.TextChoices):
    FACULTY = "FACULTY", "Faculty"
    SCHOOL = "SCHOOL", "School"
    COLLEGE = "COLLEGE", "College"


class InstitutionStatus(models.TextChoices):
    PENDING_PAYMENT = "PENDING_PAYMENT", "Pending Invoice Payment"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED", "Payment Submitted (Under Review)"
    ACTIVE = "ACTIVE", "Active"
    PROVISIONING = "PROVISIONING", "Provisioning"
    SUSPENDED = "SUSPENDED", "Suspended"
    REJECTED = "REJECTED", "Payment Rejected"


class DivisionType(models.TextChoices):
    FACULTY = "FACULTY", "Faculty"
    SCHOOL = "SCHOOL", "School"
    COLLEGE = "COLLEGE", "College"


class AwardLevel(models.TextChoices):
    BSC = "BSC", "Bachelor of Science (B.Sc.)"
    BTECH = "BTECH", "Bachelor of Technology (B.Tech.)"
    BENG = "BENG", "Bachelor of Engineering (B.Eng.)"
    BA = "BA", "Bachelor of Arts (B.A.)"
    BED = "BED", "Bachelor of Education (B.Ed.)"
    LLB = "LLB", "Bachelor of Laws (LL.B.)"
    MBBS = "MBBS", "Bachelor of Medicine & Surgery (MBBS)"
    ND = "ND", "National Diploma (ND)"
    HND = "HND", "Higher National Diploma (HND)"
    NCE = "NCE", "Nigeria Certificate in Education (NCE)"
    PGD = "PGD", "Postgraduate Diploma (PGD)"
    MSC = "MSC", "Master of Science (M.Sc.)"


class SemesterChoice(models.TextChoices):
    FIRST_SEMESTER = "FIRST_SEMESTER", "First Semester"
    SECOND_SEMESTER = "SECOND_SEMESTER", "Second Semester"


class SiwesPatternChoice(models.TextChoices):
    SPLIT_200L_300L = "SPLIT_200L_300L", "Split Vacation (3 Mo @ 200L End + 3 Mo @ 300L End)"
    SEM2_300L = "SEM2_300L", "300 Level Second Semester (6 Months Continuous)"
    YEAR4_400L_EXTENDED = "YEAR4_400L_EXTENDED", "400 Level Extended (6 to 9 Months Attachment)"
    ND_VACATION = "ND_VACATION", "ND Industrial Attachment (3 to 4 Months Vacation)"
    POST_ND_MANDATORY = "POST_ND_MANDATORY", "Post-ND Mandatory Industrial Training (12 Months)"
    TEACHING_PRACTICE = "TEACHING_PRACTICE", "Teaching Practice / Practicum (3 to 6 Months)"
    EXEMPT = "EXEMPT", "Exempt / Non-Participating (0 Months)"


class SiwesAcademicImpactChoice(models.TextChoices):
    VACATION_ONLY = "VACATION_ONLY", "Vacation Only (Zero Academic Semester Disruption)"
    SECOND_SEMESTER_SUBSTITUTE = "SECOND_SEMESTER_SUBSTITUTE", "Replaces Second Semester Coursework"
    FULL_SESSION_ATTACHMENT = "FULL_SESSION_ATTACHMENT", "Replaces Full Academic Session"
    EXEMPT = "EXEMPT", "No Academic Impact"


class DocumentType(models.TextChoices):
    STUDENT_HANDBOOK = "STUDENT_HANDBOOK", "Student Handbook"
    SIWES_CALENDAR = "SIWES_CALENDAR", "SIWES / ITF Guidelines & Calendar"
    CURRICULUM_BMAS = "CURRICULUM_BMAS", "Curriculum Standards (CCMAS / BMAS)"
    EMPLOYER_BRIEF = "EMPLOYER_BRIEF", "Employer Partnership Brief"
    POLICY = "POLICY", "Institutional Policy & Code of Conduct"


class EmbeddingStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Ingestion"
    INDEXED = "INDEXED", "Indexed in pgvector"
    FAILED = "FAILED", "Failed Processing"


class Institution(models.Model):
    """Tenant root representing a Nigerian Tertiary Institution."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, help_text="e.g. Federal University of Technology, Minna")
    short_name = models.CharField(max_length=60, help_text="e.g. FUTMinna / YabaTech")
    slug = models.SlugField(max_length=100, unique=True)
    institution_type = models.CharField(
        max_length=30,
        choices=InstitutionType.choices,
        default=InstitutionType.UNIVERSITY,
    )
    ownership = models.CharField(
        max_length=20,
        choices=OwnershipType.choices,
        default=OwnershipType.FEDERAL,
    )
    regulator = models.CharField(
        max_length=20,
        choices=RegulatorType.choices,
        default=RegulatorType.NUC,
    )
    tier_two_term = models.CharField(
        max_length=20,
        choices=TierTwoTerm.choices,
        default=TierTwoTerm.FACULTY,
        help_text="Customizes UI label: 'Faculty' in Universities, 'School' in Polytechnics/COEs, 'College' in Collegiate institutions",
    )
    domain_whitelist = models.JSONField(
        default=list,
        blank=True,
        help_text="Email domains allowed for institutional staff and student self-enrollment e.g. ['@futminna.edu.ng']",
    )
    address = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=50, blank=True, help_text="Nigerian State e.g. Niger, Lagos, Kaduna")
    is_founding_partner = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=InstitutionStatus.choices,
        default=InstitutionStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Institution"
        verbose_name_plural = "Institutions"

    def __str__(self) -> str:
        return f"{self.name} ({self.short_name})"


class AcademicDivision(models.Model):
    """Tier 2: Faculty in Universities, School in Polytechnics/COEs, or College in Medical/Agricultural setups."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="divisions",
    )
    name = models.CharField(max_length=200, help_text="e.g. School of Information and Communication Technology")
    code = models.CharField(max_length=20, blank=True, help_text="e.g. SICT")
    division_type = models.CharField(
        max_length=20,
        choices=DivisionType.choices,
        default=DivisionType.FACULTY,
    )
    dean_name = models.CharField(max_length=150, blank=True)
    dean_email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["institution", "name"]
        unique_together = ("institution", "name")
        verbose_name = "Academic Division (Faculty / School)"
        verbose_name_plural = "Academic Divisions (Faculties / Schools)"

    def __str__(self) -> str:
        return f"{self.name} — {self.institution.short_name}"


class Department(models.Model):
    """Tier 3: Academic Department housing degree programs and faculty evaluators."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="departments",
    )
    division = models.ForeignKey(
        AcademicDivision,
        on_delete=models.CASCADE,
        related_name="departments",
    )
    name = models.CharField(max_length=200, help_text="e.g. Department of Software Engineering")
    code = models.CharField(max_length=20, blank=True, help_text="e.g. SWE")
    hod_name = models.CharField(max_length=150, blank=True, help_text="Head of Department Name")
    hod_email = models.EmailField(blank=True)
    siwes_eligible = models.BooleanField(
        default=True,
        help_text="Designates whether students in this department participate in national SIWES cycles",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["division", "name"]
        unique_together = ("division", "name")
        verbose_name = "Academic Department"
        verbose_name_plural = "Academic Departments"

    def __str__(self) -> str:
        return f"{self.name} ({self.division.name})"


class AcademicProgram(models.Model):
    """Tier 4: Leaf node representing specific degree award options or NCE subject combinations."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="programs",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="programs",
    )
    name = models.CharField(max_length=200, help_text="e.g. B.Tech Software Engineering / ND Computer Science")
    program_code = models.CharField(max_length=30, blank=True, help_text="e.g. SWE-BTECH / ND-CS")
    award_level = models.CharField(
        max_length=20,
        choices=AwardLevel.choices,
        default=AwardLevel.BSC,
    )
    duration_years = models.PositiveSmallIntegerField(
        default=4,
        help_text="Standard program duration in years (e.g. 5 for Engineering, 2 for ND, 3 for NCE)",
    )
    siwes_duration_months = models.PositiveSmallIntegerField(
        default=6,
        help_text="Typical SIWES attachment period in months (0 if not applicable)",
    )
    siwes_pattern = models.CharField(
        max_length=35,
        choices=SiwesPatternChoice.choices,
        default=SiwesPatternChoice.SEM2_300L,
        help_text="Operational timeline and calendar structure for student industrial training",
    )
    siwes_academic_impact = models.CharField(
        max_length=35,
        choices=SiwesAcademicImpactChoice.choices,
        default=SiwesAcademicImpactChoice.SECOND_SEMESTER_SUBSTITUTE,
        help_text="Specifies whether SIWES runs purely during vacation or substitutes regular semester coursework",
    )
    siwes_target_levels = models.JSONField(
        default=list,
        blank=True,
        help_text="List of qualifying level numbers, e.g. [2, 3] for split vacation or [4] for 400L",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["department", "name"]
        unique_together = ("department", "name")
        verbose_name = "Academic Programme"
        verbose_name_plural = "Academic Programmes"

    def __str__(self) -> str:
        return f"{self.name} [{self.get_award_level_display()}]"


class AcademicSession(models.Model):
    """Academic session and semester tracking for cohort lifecycle governance."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    session_label = models.CharField(max_length=20, help_text="e.g. 2025/2026")
    start_date = models.DateField(null=True, blank=True, help_text="Overall session start date")
    end_date = models.DateField(null=True, blank=True, help_text="Overall session end date")
    first_semester_start_date = models.DateField(null=True, blank=True, help_text="First semester start date")
    first_semester_end_date = models.DateField(null=True, blank=True, help_text="First semester end date")
    second_semester_start_date = models.DateField(null=True, blank=True, help_text="Second semester start date")
    second_semester_end_date = models.DateField(null=True, blank=True, help_text="Second semester end date")
    current_semester = models.CharField(
        max_length=30,
        choices=SemesterChoice.choices,
        default=SemesterChoice.FIRST_SEMESTER,
    )
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-session_label", "-is_current"]
        unique_together = ("institution", "session_label")
        verbose_name = "Academic Session"
        verbose_name_plural = "Academic Sessions"

    def __str__(self) -> str:
        status = " (Current)" if self.is_current else ""
        return f"{self.institution.short_name} — {self.session_label}{status}"


class InstitutionalDocument(models.Model):
    """Official student handbooks, SIWES calendars, and departmental guidelines ingested into pgvector."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    division = models.ForeignKey(
        AcademicDivision,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
        help_text="Academic session this document applies to (e.g. 2025/2026)",
    )
    title = models.CharField(max_length=255, help_text="e.g. FUTMinna 2025/2026 SIWES Operational Guidelines")
    doc_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.STUDENT_HANDBOOK,
    )
    file = models.FileField(
        upload_to="institutional_documents/%Y/%m/",
        null=True,
        blank=True,
        help_text="Uploaded handbook or guidelines document (PDF, DOCX, TXT)",
    )
    file_path = models.CharField(max_length=500, blank=True, help_text="Relative storage or media path")
    content_hash = models.CharField(max_length=128, blank=True, help_text="SHA-256 hash of document for auditability")
    chunk_count = models.PositiveIntegerField(default=0)
    embedding_status = models.CharField(
        max_length=20,
        choices=EmbeddingStatus.choices,
        default=EmbeddingStatus.PENDING,
    )
    raw_text = models.TextField(blank=True, help_text="Extracted text from document")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Institutional Document"
        verbose_name_plural = "Institutional Documents"

    def __str__(self) -> str:
        return f"{self.title} ({self.get_doc_type_display()})"


class InstitutionalDocumentChunk(models.Model):
    """Vector-embedded text chunk stored in pgvector for zero-hallucination citation retrieval."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        InstitutionalDocument,
        on_delete=models.CASCADE,
        related_name="chunks",
    )
    chunk_index = models.PositiveIntegerField()
    page_number = models.PositiveIntegerField(default=1)
    section_reference = models.CharField(
        max_length=200,
        blank=True,
        help_text="e.g. Section 4.2: Placement Prerequisites",
    )
    content = models.TextField()
    embedding = VectorField(
        dimensions=384,
        null=True,
        blank=True,
        help_text="384-dimensional vector embedding (bge-small-en-v1.5 / all-MiniLM-L6-v2) for cosine similarity search in PostgreSQL",
    )
    is_header = models.BooleanField(
        default=False,
        help_text="Indicates whether this chunk represents a major section heading or table of contents",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["document", "chunk_index"]
        unique_together = ("document", "chunk_index")
        verbose_name = "Document Chunk (Vector)"
        verbose_name_plural = "Document Chunks (Vector)"

    def __str__(self) -> str:
        return f"{self.document.title} [Chunk #{self.chunk_index}, p.{self.page_number}]"


class InstitutionStaff(models.Model):
    """Institutional staff member, dean, HOD, counsellor, or superadmin."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="institution_staff_profiles",
    )
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="staff_members",
    )
    division = models.ForeignKey(
        AcademicDivision,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
    )
    role = models.CharField(
        max_length=40,
        choices=InstitutionRole.choices,
        default=InstitutionRole.SUPERADMIN,
    )
    title = models.CharField(
        max_length=150,
        blank=True,
        help_text="e.g. Director of ICT / Dean of SICT / HOD Computer Science",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["institution", "role", "user__name"]
        unique_together = ("user", "institution")
        verbose_name = "Institution Staff"
        verbose_name_plural = "Institution Staff"

    def __str__(self) -> str:
        return f"{self.user.email} — {self.get_role_display()} ({self.institution.short_name})"


class StaffRoleAtUnit(models.TextChoices):
    DEAN = "DEAN", "Dean of Division"
    SUB_DEAN = "SUB_DEAN", "Sub-Dean (Academics / Student Affairs)"
    HOD = "HOD", "Head of Department (HOD)"
    DEPARTMENTAL_COUNSELLOR = "DEPARTMENTAL_COUNSELLOR", "Departmental Career Counsellor"
    FACULTY_COUNSELLOR = "FACULTY_COUNSELLOR", "Faculty Lead Counsellor"
    SIWES_COORDINATOR = "SIWES_COORDINATOR", "Departmental SIWES Coordinator"
    ACADEMIC_ADVISER = "ACADEMIC_ADVISER", "Level Academic Adviser"
    FACULTY_EVALUATOR = "FACULTY_EVALUATOR", "Technical Milestone Evaluator"
    DIRECTOR_CAREER_SERVICES = "DIRECTOR_CAREER_SERVICES", "Director of Career Services (Institution-Wide)"
    SUPERADMIN = "SUPERADMIN", "Institution Superadmin"


class StaffAssignment(models.Model):
    """Fine-grained scoping for staff members assigned to specific faculties, departments, and roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_assignments",
    )
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="staff_assignments",
    )
    division = models.ForeignKey(
        AcademicDivision,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_assignments",
        help_text="If set and department is null, staff is scoped to the entire division/faculty",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_assignments",
        help_text="If set, staff is scoped to this specific department",
    )
    role_at_unit = models.CharField(
        max_length=40,
        choices=StaffRoleAtUnit.choices,
        default=StaffRoleAtUnit.FACULTY_EVALUATOR,
    )
    official_title = models.CharField(
        max_length=200,
        blank=True,
        help_text="e.g. Academic Adviser — 300L SLT Track",
    )
    assigned_years_of_study = models.JSONField(
        default=list,
        blank=True,
        help_text="List of years of study assigned (e.g. [3, 4, 5])",
    )
    can_evaluate_milestones = models.BooleanField(
        default=True,
        help_text="Permission to authenticate student evidence and milestones",
    )
    can_manage_waivers = models.BooleanField(
        default=False,
        help_text="Permission to grant prerequisite waivers for SIWES placement",
    )
    max_caseload = models.PositiveIntegerField(
        default=150,
        help_text="Maximum student caseload allocation",
    )
    is_primary = models.BooleanField(
        default=True,
        help_text="Marks this assignment as the staff member's primary institutional post",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["institution", "department", "user__name"]
        verbose_name = "Staff Assignment"
        verbose_name_plural = "Staff Assignments"

    def __str__(self) -> str:
        unit = self.department.name if self.department else (self.division.name if self.division else self.institution.short_name)
        return f"{self.user.email} — {self.get_role_at_unit_display()} ({unit})"


class EntryMode(models.TextChoices):
    UTME = "UTME", "UTME (Standard Entry - Year 1)"
    DIRECT_ENTRY = "DIRECT_ENTRY", "Direct Entry (DE - Year 2)"
    TRANSFER = "TRANSFER", "Inter-Faculty / University Transfer"
    CONVERSION = "CONVERSION", "HND to B.Sc. Conversion"


class AcademicStanding(models.TextChoices):
    IN_GOOD_STANDING = "IN_GOOD_STANDING", "In Good Standing"
    PROBATION = "PROBATION", "Academic Warning / Probation"
    SIWES_SUSPENDED = "SIWES_SUSPENDED", "SIWES Clearance Suspended"
    GRADUATED = "GRADUATED", "Graduated (Awaiting NYSC)"
    ALUMNI = "ALUMNI", "Alumni / Post-NYSC"
    DEFERRED = "DEFERRED", "Session Deferred"


class SIWESClearanceStatus(models.TextChoices):
    NOT_ELIGIBLE = "NOT_ELIGIBLE", "Not Yet Eligible (Pre-SIWES Year)"
    QUALIFYING = "QUALIFYING", "Qualifying (Prerequisites in Progress)"
    CLEARED = "CLEARED", "Cleared by HOD & Coordinator (Ready for Placement)"
    ON_ATTACHMENT = "ON_ATTACHMENT", "Active On Attachment"
    COMPLETED = "COMPLETED", "Attachment Logbook & Presentation Completed"


class StudentProfile(models.Model):
    """
    Hierarchical Student Identity anchored directly to AcademicProgram (Tier 4).
    Dynamically computes student level based on the program's duration_years (4-yr, 5-yr, 2-yr ND/HND, 3-yr NCE).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    institution = models.ForeignKey(
        Institution,
        on_delete=models.PROTECT,
        related_name="students",
    )
    program = models.ForeignKey(
        AcademicProgram,
        on_delete=models.PROTECT,
        related_name="enrolled_students",
        help_text="Tier-4 degree option (which links to Department -> Division -> Institution)",
    )
    matric_number = models.CharField(
        max_length=50,
        db_index=True,
        help_text="e.g. 2021/1/74892CS or GSU/SCI/CSC/22/0104",
    )
    jamb_reg_number = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="JAMB registration number for national verification",
    )
    entry_session = models.ForeignKey(
        AcademicSession,
        on_delete=models.PROTECT,
        related_name="matriculated_students",
    )
    entry_mode = models.CharField(
        max_length=20,
        choices=EntryMode.choices,
        default=EntryMode.UTME,
    )
    year_of_study = models.PositiveSmallIntegerField(
        default=1,
        help_text="Current year of study (1 to 6), e.g. 1 for 100L/ND I, 4 for 400L/HND II, 5 for 500L SLT/Eng",
    )
    is_spillover = models.BooleanField(
        default=False,
        help_text="True if student has exceeded standard program duration",
    )
    cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Current cumulative grade point average (e.g. 4.35)",
    )
    academic_standing = models.CharField(
        max_length=30,
        choices=AcademicStanding.choices,
        default=AcademicStanding.IN_GOOD_STANDING,
    )
    siwes_clearance_status = models.CharField(
        max_length=30,
        choices=SIWESClearanceStatus.choices,
        default=SIWESClearanceStatus.NOT_ELIGIBLE,
    )
    phone_number = models.CharField(max_length=30, blank=True)
    state_of_origin = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=15, blank=True)
    bio = models.TextField(blank=True)
    portfolio_url = models.URLField(
        blank=True,
        help_text="Link to student GitHub, Behance, or live project repository",
    )
    linkedin_url = models.URLField(blank=True)
    is_verified_student = models.BooleanField(
        default=True,
        help_text="True if matched with institutional admissions ledger",
    )
    active_pathway = models.ForeignKey(
        "Pathway",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enrolled_students",
        help_text="The career pathway this student is currently actively pursuing",
    )
    employability_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Composite Employability Score (0.00 - 100.00%) based on verified milestones (70%) and CGPA (30%)",
    )
    verified_points_total = models.PositiveIntegerField(
        default=0,
        help_text="Total verified milestone points accumulated by this student",
    )
    milestones_completed_count = models.PositiveIntegerField(
        default=0,
        help_text="Count of verified milestone submissions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["institution", "program", "matric_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "matric_number"],
                name="unique_matric_per_institution",
            ),
        ]
        indexes = [
            models.Index(fields=["institution", "year_of_study"]),
            models.Index(fields=["program", "year_of_study"]),
        ]
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"

    def __str__(self) -> str:
        return f"{self.matric_number} — {self.user.name or self.user.email} ({self.program.name})"

    @property
    def is_final_year(self) -> bool:
        """True if the student is in the final year of their specific program."""
        return self.year_of_study >= self.program.duration_years

    @property
    def is_siwes_year(self) -> bool:
        """
        Dynamically evaluates if the student's current year of study qualifies for SIWES
        based on the program's specific SIWES operational pattern.
        """
        if not self.program.department.siwes_eligible or self.program.siwes_pattern == SiwesPatternChoice.EXEMPT:
            return False

        # If custom target levels are explicitly defined:
        if self.program.siwes_target_levels:
            return self.year_of_study in self.program.siwes_target_levels

        pattern = self.program.siwes_pattern
        if pattern == SiwesPatternChoice.SPLIT_200L_300L:
            return self.year_of_study in [2, 3]  # Qualifying at 200L and 300L
        elif pattern == SiwesPatternChoice.SEM2_300L:
            return self.year_of_study == 3
        elif pattern == SiwesPatternChoice.YEAR4_400L_EXTENDED:
            return self.year_of_study == 4
        elif pattern == SiwesPatternChoice.ND_VACATION:
            return self.year_of_study in [1, 2]
        elif pattern == SiwesPatternChoice.POST_ND_MANDATORY:
            return self.year_of_study == 2
        elif pattern == SiwesPatternChoice.TEACHING_PRACTICE:
            return self.year_of_study in [3, 4] if self.program.duration_years >= 4 else self.year_of_study in [2, 3]

        dur = self.program.duration_years
        if dur == 5:
            return self.year_of_study == 4
        elif dur == 4:
            return self.year_of_study == 3
        elif dur == 2 and self.program.award_level == AwardLevel.ND:
            return self.year_of_study == 2
        return False

    def get_level_code(self) -> str:
        """Returns normalized level code (e.g. '100', '400', '500', 'ND_I', 'ND_II', 'NCE_III')."""
        inst_type = self.institution.institution_type
        award = self.program.award_level

        if inst_type == InstitutionType.POLYTECHNIC:
            if award == AwardLevel.ND:
                return "ND_I" if self.year_of_study == 1 else "ND_II"
            elif award == AwardLevel.HND:
                return "HND_I" if self.year_of_study == 1 else "HND_II"

        if inst_type == InstitutionType.COLLEGE_OF_EDUCATION:
            levels = {1: "NCE_I", 2: "NCE_II", 3: "NCE_III"}
            return levels.get(self.year_of_study, f"NCE_{self.year_of_study}")

        # University / standard numerical levels
        return f"{self.year_of_study * 100}"

    def get_level_display(self) -> str:
        """
        Dynamically returns human-readable level label tailored to program duration:
        e.g. '500 Level (Final Year)' for SLT/B.Tech, '400 Level (Final Year)' for 4-yr B.Sc,
        'ND II (Final Year)' for Polytechnic ND, 'NCE III (Final Year)' for College of Ed.
        """
        code = self.get_level_code()

        if self.is_spillover:
            return f"{code} Level (Spillover)"

        if self.is_final_year:
            if "ND_" in code or "HND_" in code or "NCE_" in code:
                formatted = code.replace("_", " ")
                return f"{formatted} (Final Year)"
            return f"{code} Level (Final Year)"

        if self.is_siwes_year:
            if "ND_" in code or "HND_" in code:
                formatted = code.replace("_", " ")
                return f"{formatted} (SIWES Year)"
            return f"{code} Level (SIWES Year)"

        if "ND_" in code or "HND_" in code or "NCE_" in code:
            return code.replace("_", " ")

        return f"{code} Level"

    def recalculate_employability(self) -> dict:
        """
        Calculates composite Employability Score:
        - Verified Milestone Points vs. Active Pathway Total Target Points (70% weighting)
        - Academic CGPA normalized against 5.0 scale (30% weighting)
        """
        verified_submissions = self.milestone_submissions.filter(status="VERIFIED")
        self.verified_points_total = sum(s.points_awarded for s in verified_submissions)
        self.milestones_completed_count = verified_submissions.count()

        pathway_target_points = self.active_pathway.total_points if self.active_pathway else 0

        if pathway_target_points > 0:
            milestone_ratio = min(self.verified_points_total / pathway_target_points, 1.0)
            milestone_component = milestone_ratio * 70.0
        else:
            milestone_component = 0.0

        cgpa_val = float(self.cgpa or 0.0)
        cgpa_ratio = min(cgpa_val / 5.0, 1.0)
        cgpa_component = cgpa_ratio * 30.0

        total_score = round(milestone_component + cgpa_component, 2)
        self.employability_score = total_score
        self.save(update_fields=[
            "verified_points_total",
            "milestones_completed_count",
            "employability_score",
            "updated_at",
        ])

        tier = "Foundational"
        if total_score >= 80.0:
            tier = "High-Calibre Talent"
        elif total_score >= 60.0:
            tier = "Industry Ready"
        elif total_score >= 40.0:
            tier = "Developing"

        return {
            "employability_score": float(total_score),
            "tier": tier,
            "milestone_component": round(milestone_component, 2),
            "cgpa_component": round(cgpa_component, 2),
            "verified_points": self.verified_points_total,
            "target_points": pathway_target_points,
            "milestones_completed": self.milestones_completed_count,
        }



class TemplateVisibility(models.TextChoices):
    DEPARTMENT = "DEPARTMENT", "Department Only"
    INSTITUTION = "INSTITUTION", "Institution-Wide"
    NATIONAL_CATALOG = "NATIONAL_CATALOG", "National Open Catalog"


class MilestoneType(models.TextChoices):
    FOUNDATIONAL_COURSEWORK = "FOUNDATIONAL_COURSEWORK", "Foundational Coursework Prerequisite"
    TECHNICAL_SKILL = "TECHNICAL_SKILL", "Technical Skill Mastery"
    GITHUB_PROJECT = "GITHUB_PROJECT", "Production Repository / Deployed App"
    INDUSTRY_CERTIFICATION = "INDUSTRY_CERTIFICATION", "Industry Recognized Certification"
    SIWES_PREREQUISITE = "SIWES_PREREQUISITE", "SIWES / ITCC Placement Clearance"
    INTERNSHIP_EXPERIENCE = "INTERNSHIP_EXPERIENCE", "Internship / Work Placement"
    CAPSTONE_PROJECT = "CAPSTONE_PROJECT", "Final Year Capstone Project Defense"
    CAREER_READINESS = "CAREER_READINESS", "Portfolio & Technical Interview Readiness"


class VerificationMethod(models.TextChoices):
    SUPERVISOR_SIGN_OFF = "SUPERVISOR_SIGN_OFF", "Counsellor / HOD Sign-Off"
    URL_VERIFICATION = "URL_VERIFICATION", "Repository / Live URL Review"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD", "Certificate / Document PDF Upload"
    AUTOMATED_ASSESSMENT = "AUTOMATED_ASSESSMENT", "Automated Assessment / Quiz"


class RequiredEvidenceType(models.TextChoices):
    GITHUB_REPO = "GITHUB_REPO", "GitHub / GitLab Repository URL"
    LIVE_URL = "LIVE_URL", "Live Deployed Project URL"
    CERTIFICATE_PDF = "CERTIFICATE_PDF", "Certificate PDF / Verified Credential Link"
    PORTFOLIO_LINK = "PORTFOLIO_LINK", "Portfolio Link (Behance, Dribbble, Personal Site)"
    SUPERVISOR_ENDORSEMENT = "SUPERVISOR_ENDORSEMENT", "Faculty / Industry Supervisor Form"


class Pathway(models.Model):
    """Structured career roadmap for an academic program, containing progressive milestones."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="pathways",
    )
    program = models.ForeignKey(
        AcademicProgram,
        on_delete=models.CASCADE,
        related_name="pathways",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_pathways",
    )
    title = models.CharField(
        max_length=200,
        help_text="e.g. Full-Stack Web & Cloud Architecture",
    )
    career_role = models.CharField(
        max_length=150,
        help_text="Target role e.g. Full-Stack Software Engineer, DevOps Specialist",
    )
    industry_sector = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g. Information Technology / Fintech / Telecommunications",
    )
    description = models.TextField(
        help_text="Comprehensive overview of competencies and expected learning outcomes",
    )
    target_cgpa_recommendation = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended minimum CGPA (e.g. 3.00)",
    )
    total_milestones_count = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(
        default=0,
        help_text="Total employability points accumulated across all milestones",
    )
    is_active = models.BooleanField(default=True)
    is_template = models.BooleanField(
        default=False,
        help_text="If True, serves as a master template blueprint in the institutional catalog",
    )
    template_visibility = models.CharField(
        max_length=25,
        choices=TemplateVisibility.choices,
        default=TemplateVisibility.INSTITUTION,
    )
    cloned_from = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cloned_derivatives",
        help_text="Master template from which this pathway was cloned",
    )
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["program", "title"]
        verbose_name = "Career Pathway"
        verbose_name_plural = "Career Pathways"

    def __str__(self) -> str:
        tag = " [TEMPLATE]" if self.is_template else ""
        return f"{self.title} ({self.program.name}){tag}"

    def recalculate_totals(self) -> None:
        """Updates total_milestones_count and total_points from child milestones."""
        milestones = self.milestones.all()
        self.total_milestones_count = milestones.count()
        self.total_points = sum(m.points for m in milestones)
        self.save(update_fields=["total_milestones_count", "total_points", "updated_at"])


class PathwayMilestone(models.Model):
    """Verifiable progressive requirement within a career pathway."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pathway = models.ForeignKey(
        Pathway,
        on_delete=models.CASCADE,
        related_name="milestones",
    )
    order_index = models.PositiveSmallIntegerField(
        default=0,
        help_text="Sequence order within the pathway",
    )
    year_of_study = models.PositiveSmallIntegerField(
        default=1,
        help_text="Target academic year (1..5) matching student year of study",
    )
    target_level_code = models.CharField(
        max_length=20,
        blank=True,
        help_text="e.g. '100', '200', '300', '400', '500', 'ND_I', 'ND_II', 'NCE_I', 'NCE_II', 'NCE_III'",
    )
    target_semester = models.CharField(
        max_length=20,
        choices=[
            ("FIRST", "First Semester"),
            ("SECOND", "Second Semester"),
            ("BOTH", "Both Semesters / Annual"),
        ],
        default="FIRST",
    )
    title = models.CharField(
        max_length=255,
        help_text="e.g. Deploy Modular Microservice with CI/CD Pipeline",
    )
    description = models.TextField(
        help_text="Specific deliverables, rubric criteria, and requirements",
    )
    milestone_type = models.CharField(
        max_length=30,
        choices=MilestoneType.choices,
        default=MilestoneType.TECHNICAL_SKILL,
    )
    points = models.PositiveIntegerField(
        default=100,
        help_text="Employability weighting score assigned to this milestone",
    )
    is_mandatory = models.BooleanField(
        default=True,
        help_text="Whether completion is strictly required for pathway badge",
    )
    verification_method = models.CharField(
        max_length=30,
        choices=VerificationMethod.choices,
        default=VerificationMethod.SUPERVISOR_SIGN_OFF,
    )
    required_evidence_type = models.CharField(
        max_length=30,
        choices=RequiredEvidenceType.choices,
        default=RequiredEvidenceType.GITHUB_REPO,
    )
    competency_tags = models.JSONField(
        default=list,
        blank=True,
        help_text="List of skill keywords, e.g. ['React', 'TypeScript', 'Docker', 'PostgreSQL']",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["pathway", "order_index", "year_of_study"]
        verbose_name = "Pathway Milestone"
        verbose_name_plural = "Pathway Milestones"

    def __str__(self) -> str:
        return f"{self.pathway.title} — Step {self.order_index + 1}: {self.title} ({self.points} pts)"


class SubmissionStatus(models.TextChoices):
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
    VERIFIED = "VERIFIED", "Verified & Points Awarded"
    CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes / Re-submission Requested"
    REJECTED = "REJECTED", "Rejected / Incomplete"


class StudentMilestoneSubmission(models.Model):
    """Verifiable student submission for a pathway milestone with counsellor evaluation."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="milestone_submissions",
    )
    milestone = models.ForeignKey(
        PathwayMilestone,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    status = models.CharField(
        max_length=25,
        choices=SubmissionStatus.choices,
        default=SubmissionStatus.PENDING_REVIEW,
    )
    evidence_url = models.URLField(
        blank=True,
        null=True,
        help_text="GitHub repository URL or Live demo deployment link",
    )
    evidence_file = models.FileField(
        upload_to="student_evidence/%Y/%m/",
        blank=True,
        null=True,
        help_text="Uploaded certificate PDF or supervisor endorsement form",
    )
    submission_notes = models.TextField(
        blank=True,
        help_text="Student description of work completed, architectural decisions, or SIWES context",
    )
    points_awarded = models.PositiveIntegerField(
        default=0,
        help_text="Points awarded upon verification (defaults to milestone.points)",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_milestones",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_feedback = models.TextField(
        blank=True,
        help_text="Counsellor or HOD remarks and evaluation notes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "milestone"],
                name="unique_student_milestone_submission",
            )
        ]
        verbose_name = "Student Milestone Submission"
        verbose_name_plural = "Student Milestone Submissions"

    def __str__(self) -> str:
        return f"{self.student.matric_number} — {self.milestone.title} ({self.status})"


# =============================================================================
# Diagnostic Assessments & Psychometric Models
# =============================================================================

class AssessmentType(models.TextChoices):
    BIG_FIVE = "BIG_FIVE", "Big Five Personality Inventory (OCEAN)"
    HOLLAND_RIASEC = "HOLLAND_RIASEC", "Holland RIASEC Vocational Interests"
    NUMERICAL_REASONING = "NUMERICAL_REASONING", "Numerical & Logical Reasoning"
    DIGITAL_SKILLS = "DIGITAL_SKILLS", "Digital & Technical Skill Diagnostic"


class DiagnosticAssessment(models.Model):
    """Catalog of available diagnostic, psychometric, and cognitive skill tests."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="custom_assessments",
        help_text="Null for national standard assessments; set for institution-customized tests.",
    )
    assessment_type = models.CharField(max_length=40, choices=AssessmentType.choices)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField()
    instructions = models.TextField(blank=True, default="")
    estimated_minutes = models.PositiveIntegerField(default=10)
    total_questions = models.PositiveIntegerField(default=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["assessment_type", "title"]
        verbose_name = "Diagnostic Assessment"
        verbose_name_plural = "Diagnostic Assessments"

    def __str__(self) -> str:
        return f"{self.title} ({self.get_assessment_type_display()})"


class DiagnosticQuestion(models.Model):
    """Individual item in a diagnostic assessment question bank."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(
        DiagnosticAssessment,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    order_index = models.PositiveIntegerField(default=0)
    prompt = models.TextField(help_text="Question text or psychometric statement")
    dimension = models.CharField(
        max_length=50,
        help_text="Subscale/Trait code (e.g. 'OPENNESS', 'CONSCIENTIOUSNESS', 'REALISTIC', 'INVESTIGATIVE', 'LOGIC')",
    )
    is_reverse_scored = models.BooleanField(
        default=False,
        help_text="True if Likert scale must be inverted (6 - score)",
    )
    question_type = models.CharField(
        max_length=30,
        choices=[
            ("LIKERT_5", "5-Point Likert Scale (1-5)"),
            ("MULTIPLE_CHOICE", "Multiple Choice Single Answer"),
        ],
        default="LIKERT_5",
    )
    options = models.JSONField(
        default=list,
        blank=True,
        help_text="For multiple-choice items: [{id: 'A', text: '...', is_correct: True, points: 10}]",
    )
    explanation = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["assessment", "order_index"]
        verbose_name = "Diagnostic Question"
        verbose_name_plural = "Diagnostic Questions"

    def __str__(self) -> str:
        return f"{self.assessment.title} - Q{self.order_index + 1}: {self.dimension}"


class StudentAssessmentSession(models.Model):
    """Recorded student assessment attempt with calculated psychometric profile."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="assessment_sessions",
    )
    assessment = models.ForeignKey(
        DiagnosticAssessment,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    status = models.CharField(
        max_length=30,
        choices=[
            ("IN_PROGRESS", "In Progress"),
            ("COMPLETED", "Completed"),
            ("ABANDONED", "Abandoned"),
        ],
        default="IN_PROGRESS",
    )
    raw_responses = models.JSONField(
        default=dict,
        help_text="Dict of {question_id: selected_value}",
    )
    dimension_scores = models.JSONField(
        default=dict,
        help_text="Computed subscale scores: {'OPENNESS': 82.5, 'CONSCIENTIOUSNESS': 90.0, ...}",
    )
    summary_code = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="e.g. Holland 3-letter code 'IRC' or Big Five summary",
    )
    percentile_rank = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    summary_report = models.TextField(blank=True, default="")
    career_recommendations = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-completed_at", "-started_at"]
        verbose_name = "Student Assessment Session"
        verbose_name_plural = "Student Assessment Sessions"

    def __str__(self) -> str:
        return f"{self.student.matric_number} - {self.assessment.title} ({self.status})"


# =============================================================================
# 24/7 AI Career Coach Models
# =============================================================================

class AICoachConversation(models.Model):
    """Multi-turn conversation thread between student and 24/7 AI Career Coach."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
    )
    title = models.CharField(max_length=200, default="Career & SIWES Advisory Session")
    is_active = models.BooleanField(default=True)
    case_summary = models.TextField(
        blank=True,
        default="",
        help_text="AI-synthesized 3-bullet summary of student questions for human counsellor handoff",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "AI Coach Conversation"
        verbose_name_plural = "AI Coach Conversations"

    def __str__(self) -> str:
        return f"{self.student.matric_number}: {self.title} ({self.created_at.strftime('%Y-%m-%d')})"


class AICoachMessage(models.Model):
    """Individual message turn in an AI Coach conversation."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        AICoachConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(
        max_length=20,
        choices=[
            ("user", "Student"),
            ("assistant", "AI Coach"),
            ("system", "System Grounding"),
        ],
    )
    content = models.TextField()
    citations = models.JSONField(
        default=list,
        blank=True,
        help_text="List of grounded institutional document references with chunk IDs",
    )
    telemetry = models.JSONField(
        default=dict,
        blank=True,
        help_text="Latency, tokens, model name",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "AI Coach Message"
        verbose_name_plural = "AI Coach Messages"

    def __str__(self) -> str:
        return f"[{self.role}] {self.content[:50]}..."


# =============================================================================
# Seamless Counsellor Handoff & Booking Models
# =============================================================================

class CounsellingTopic(models.TextChoices):
    PATHWAY_ALIGNMENT = "PATHWAY_ALIGNMENT", "Career Pathway & Milestone Planning"
    SIWES_CLEARANCE = "SIWES_CLEARANCE", "SIWES Placement, Logbook & Clearance"
    ASSESSMENT_DEBRIEF = "ASSESSMENT_DEBRIEF", "Psychometric & Skills Diagnostic Debrief"
    RESUME_CV_REVIEW = "RESUME_CV_REVIEW", "Resume, Portfolio & Cover Letter Review"
    EMPLOYER_PLACEMENT = "EMPLOYER_PLACEMENT", "Graduate Job Placement & Internship Advisory"
    ACADEMIC_STANDING = "ACADEMIC_STANDING", "Academic Standing & CGPA Improvement"


class CounsellingSessionStatus(models.TextChoices):
    REQUESTED = "REQUESTED", "Session Requested"
    CONFIRMED = "CONFIRMED", "Confirmed / Scheduled"
    COMPLETED = "COMPLETED", "Completed"
    RESCHEDULED = "RESCHEDULED", "Rescheduled"
    CANCELLED = "CANCELLED", "Cancelled"


class CounsellingSession(models.Model):
    """Scheduled 1-on-1 career counselling appointment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="counselling_sessions",
    )
    counsellor = models.ForeignKey(
        InstitutionStaff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_sessions",
    )
    topic = models.CharField(max_length=40, choices=CounsellingTopic.choices)
    student_notes = models.TextField(
        blank=True,
        default="",
        help_text="Student description of guidance needed",
    )
    status = models.CharField(
        max_length=30,
        choices=CounsellingSessionStatus.choices,
        default=CounsellingSessionStatus.REQUESTED,
    )
    preferred_date = models.DateField()
    preferred_time_slot = models.CharField(
        max_length=50,
        help_text="e.g. '10:00 AM - 10:45 AM' or '2:00 PM - 2:45 PM'",
    )
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    meeting_mode = models.CharField(
        max_length=30,
        choices=[
            ("IN_PERSON", "In-Person (Department Office)"),
            ("VIRTUAL_CALL", "Virtual Video / Voice Call"),
        ],
        default="IN_PERSON",
    )
    meeting_location = models.CharField(
        max_length=200,
        blank=True,
        default="Departmental Career & SIWES Office",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-preferred_date", "-created_at"]
        verbose_name = "Counselling Session"
        verbose_name_plural = "Counselling Sessions"

    def __str__(self) -> str:
        return f"{self.student.matric_number} - {self.get_topic_display()} ({self.status})"


class CounsellingCaseNote(models.Model):
    """Confidential case note documented by staff regarding a student's career session."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        CounsellingSession,
        on_delete=models.CASCADE,
        related_name="case_notes",
        null=True,
        blank=True,
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="counsellor_case_notes",
    )
    author = models.ForeignKey(
        InstitutionStaff,
        on_delete=models.CASCADE,
        related_name="authored_notes",
    )
    summary = models.TextField(help_text="Key takeaways, obstacles identified, and advice given")
    action_items = models.JSONField(
        default=list,
        blank=True,
        help_text="List of [{task: '...', due_date: '...', done: False}]",
    )
    is_confidential = models.BooleanField(
        default=True,
        help_text="Visible only to assigned faculty counsellors and HOD",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Counselling Case Note"
        verbose_name_plural = "Counselling Case Notes"

    def __str__(self) -> str:
        return f"Case Note for {self.student.matric_number} by {self.author.user.name} ({self.created_at.strftime('%Y-%m-%d')})"


class InvoiceStatus(models.TextChoices):
    UNPAID = "UNPAID", "Unpaid / Pending Transfer"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED", "Payment Submitted (Under Review)"
    PAID = "PAID", "Paid & Confirmed"
    VOID = "VOID", "Void / Cancelled"
    REJECTED = "REJECTED", "Payment Proof Rejected"


class CompanyBankDetail(models.Model):
    """Company bank account details configured by System Admin for wire transfer invoices."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account_name = models.CharField(max_length=255, default="Nexus Edutech Consult Ltd")
    bank_name = models.CharField(max_length=255, default="Zenith Bank Plc")
    account_number = models.CharField(max_length=50, default="1228490211")
    sort_code_or_swift = models.CharField(max_length=50, blank=True, help_text="Optional Sort Code, SWIFT, or Branch Code")
    currency = models.CharField(max_length=10, default="NGN", help_text="e.g. NGN, USD, GBP")
    payment_instructions = models.TextField(
        default="Please include your Institution Name and Invoice Reference in the transfer narration/remark. Once transfer is completed, upload your payment receipt directly to the portal.",
        help_text="Instructions displayed on generated invoices and the payment portal",
    )
    support_email = models.EmailField(default="billing@nexus.ng")
    support_phone = models.CharField(max_length=50, blank=True, default="+234 (0) 800 000 NEXUS")
    is_active = models.BooleanField(default=True, help_text="If active, this bank account will appear on newly generated invoices")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "-created_at"]
        verbose_name = "Company Bank Detail"
        verbose_name_plural = "Company Bank Details"

    def __str__(self) -> str:
        return f"{self.bank_name} - {self.account_number} ({self.account_name})"


class PricingPlan(models.Model):
    """Institutional pricing tiers and subscription fees configured by System Admin."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, help_text="Unique identifier e.g. foundation, standard, flagship")
    name = models.CharField(max_length=100, help_text="e.g. Foundation Tier, Standard Tier, Flagship Enterprise")
    target_institution_type = models.CharField(
        max_length=255,
        blank=True,
        help_text="e.g. Colleges of Education, State Universities, Federal Universities",
    )
    description = models.TextField(blank=True)
    base_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Annual or base license fee (in specified currency)")
    setup_onboarding_fee = models.DecimalField(max_digits=12, decimal_places=2, default=150000.00, help_text="One-time onboarding & faculty calibration fee")
    per_student_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Per student seat fee if applicable")
    max_students = models.PositiveIntegerField(default=5000, help_text="Student seat capacity limit (0 for unlimited)")
    features = models.JSONField(default=list, blank=True, help_text="List of feature bullet strings")
    currency = models.CharField(max_length=10, default="NGN")
    billing_cycle = models.CharField(
        max_length=30,
        default="ANNUAL",
        choices=[("ANNUAL", "Annual"), ("ONE_TIME", "One-Time Pilot"), ("SEMESTER", "Per Semester")],
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["base_fee"]
        verbose_name = "Pricing Plan & Fee Structure"
        verbose_name_plural = "Pricing Plans & Fee Structures"

    def __str__(self) -> str:
        return f"{self.name} ({self.currency} {self.base_fee:,.2f})"


class InstitutionInvoice(models.Model):
    """Official invoice issued to an institution upon onboarding, with payment receipt tracking."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=60, unique=True, help_text="e.g. INV-NEXUS-2026-0001")
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    plan = models.ForeignKey(
        PricingPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    plan_name = models.CharField(max_length=100)
    issued_to_name = models.CharField(max_length=255, help_text="Institutional Admin or Contact Name")
    issued_to_email = models.EmailField()
    subtotal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    setup_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vat_rate = models.DecimalField("VAT Rate (%)", max_digits=5, decimal_places=2, default=7.50)
    vat_amount = models.DecimalField("VAT Amount", max_digits=12, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="NGN")
    status = models.CharField(
        max_length=30,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.UNPAID,
    )
    bank_details_snapshot = models.JSONField(
        default=dict,
        blank=True,
        help_text="Snapshot of company bank details at the time of invoice issuance",
    )
    items_breakdown = models.JSONField(
        default=list,
        blank=True,
        help_text="List of line items e.g. [{'description': '...', 'amount': 1500000}]",
    )
    due_date = models.DateField()

    # Payment receipt submission fields
    payment_reference = models.CharField(max_length=100, blank=True, help_text="Bank transaction reference number entered by payer")
    payment_receipt_file = models.FileField(upload_to="payment_receipts/%Y/%m/", blank=True, null=True, help_text="Uploaded bank transfer receipt or proof")
    payer_bank_name = models.CharField(max_length=150, blank=True)
    payer_account_name = models.CharField(max_length=150, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    payment_notes = models.TextField(blank=True, help_text="Notes/remarks from the institution regarding the transfer")
    payment_submitted_at = models.DateTimeField(null=True, blank=True)

    # Confirmation by System Admin
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="confirmed_invoices",
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, help_text="Internal notes by System Admin during verification")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Institution Invoice"
        verbose_name_plural = "Institution Invoices"

    def __str__(self) -> str:
        return f"{self.invoice_number} - {self.institution.name} ({self.status})"

    def save(self, *args, **kwargs):
        if self.status == InvoiceStatus.PAID:
            if not self.confirmed_at:
                self.confirmed_at = timezone.now()
            if self.institution_id and self.institution.status != InstitutionStatus.ACTIVE:
                self.institution.status = InstitutionStatus.ACTIVE
                self.institution.save(update_fields=["status", "updated_at"])
        elif self.status == InvoiceStatus.REJECTED:
            if self.institution_id and self.institution.status != InstitutionStatus.REJECTED:
                self.institution.status = InstitutionStatus.REJECTED
                self.institution.save(update_fields=["status", "updated_at"])
        super().save(*args, **kwargs)


class LoginOTP(models.Model):
    """One-time passcode for secure staff/admin sign-in."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="login_otps",
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"OTP for {self.user.email} ({'used' if self.used else 'active'})"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at


class LearningResourceType(models.TextChoices):
    VIDEO = "VIDEO", "Video (YouTube)"
    DOCUMENT = "DOCUMENT", "Document / Handout"
    WORKSHOP = "WORKSHOP", "Workshop / Seminar"


_YOUTUBE_ID_RE = re.compile(
    r"(?:youtube\.com/(?:watch\?v=|embed/|shorts/|live/)|youtu\.be/)([A-Za-z0-9_-]{11})"
)


class LearningResource(models.Model):
    """Institution-published learning content: YouTube videos and uploaded handouts/documents."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="learning_resources",
    )
    division = models.ForeignKey(
        AcademicDivision,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="learning_resources",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="learning_resources",
    )
    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="learning_resources",
        help_text="Academic session this resource applies to (e.g. 2025/2026)",
    )
    title = models.CharField(max_length=255, help_text="e.g. SIWES Orientation Workshop Recording")
    description = models.TextField(blank=True)
    resource_type = models.CharField(
        max_length=30,
        choices=LearningResourceType.choices,
        default=LearningResourceType.DOCUMENT,
    )
    youtube_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="YouTube video link (embed and thumbnail are derived from this URL)",
    )
    file = models.FileField(
        upload_to="learning_resources/%Y/%m/",
        null=True,
        blank=True,
        help_text="Uploaded handout, slides, or learning document (PDF, DOCX, PPTX, TXT)",
    )
    file_name = models.CharField(max_length=255, blank=True, help_text="Original uploaded filename")
    file_size = models.PositiveBigIntegerField(default=0, help_text="File size in bytes")
    is_published = models.BooleanField(default=True, help_text="Visible to students when checked")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Learning Resource"
        verbose_name_plural = "Learning Resources"

    def __str__(self) -> str:
        return f"{self.title} ({self.get_resource_type_display()})"

    @property
    def youtube_video_id(self) -> str | None:
        """Extracts the 11-character YouTube video ID from the stored URL, if any."""
        if not self.youtube_url:
            return None
        match = _YOUTUBE_ID_RE.search(self.youtube_url)
        return match.group(1) if match else None





